import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const ENV_VARS: Record<
  string,
  { description: string; default: string; required: boolean }
> = {
  PORT: { description: "HTTP server port", default: "3458", required: true },
  NODE_ENV: {
    description: "Runtime environment",
    default: "development",
    required: true,
  },
  DATABASE_URL: {
    description: "PostgreSQL connection string",
    default: "",
    required: true,
  },
  JWT_SECRET: {
    description: "Secret key for signing JWT tokens",
    default: "",
    required: true,
  },
  API_KEY: { description: "External API key", default: "", required: false },
  LOG_LEVEL: {
    description: "Logging verbosity (debug|info|warn|error)",
    default: "info",
    required: false,
  },
  CORS_ORIGIN: {
    description: "Allowed CORS origin URL",
    default: "http://localhost:3000",
    required: false,
  },
  RATE_LIMIT_MAX: {
    description: "Max requests per window per IP",
    default: "100",
    required: false,
  },
};

function buildEnvConfigHtml(): string {
  const rows = Object.entries(ENV_VARS)
    .map(([key, meta]) => {
      const inputType =
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("password")
          ? "password"
          : "text";
      const requiredBadge = meta.required
        ? `<span style="color:#e53e3e;font-size:11px;font-weight:600;margin-left:4px">*</span>`
        : "";
      return `
        <div class="field" id="field-${key}">
          <label for="${key}">
            <span class="var-name">${key}</span>${requiredBadge}
            <span class="description">${meta.description}</span>
          </label>
          <input
            type="${inputType}"
            id="${key}"
            name="${key}"
            placeholder="${meta.default || "(empty)"}"
            value="${meta.default}"
            ${meta.required ? "required" : ""}
            autocomplete="off"
            spellcheck="false"
          />
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Environment Variable Configuration</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      background: #0f1117;
      color: #e2e8f0;
      padding: 32px 16px;
      min-height: 100vh;
    }

    .container {
      max-width: 680px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 28px;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #f7fafc;
      letter-spacing: -0.3px;
    }

    .subtitle {
      font-size: 13px;
      color: #718096;
      margin-top: 6px;
    }

    .card {
      background: #1a1d27;
      border: 1px solid #2d3748;
      border-radius: 10px;
      padding: 24px;
    }

    .field {
      margin-bottom: 20px;
    }

    .field:last-child { margin-bottom: 0; }

    label {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 6px;
    }

    .var-name {
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 13px;
      font-weight: 600;
      color: #63b3ed;
    }

    .description {
      font-size: 11.5px;
      color: #718096;
    }

    input[type="text"], input[type="password"] {
      width: 100%;
      background: #0f1117;
      border: 1px solid #2d3748;
      border-radius: 6px;
      padding: 8px 12px;
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 13px;
      color: #e2e8f0;
      outline: none;
      transition: border-color 0.15s;
    }

    input[type="text"]:focus, input[type="password"]:focus {
      border-color: #4299e1;
      box-shadow: 0 0 0 2px rgba(66,153,225,0.2);
    }

    input:invalid:not(:placeholder-shown) {
      border-color: #e53e3e;
    }

    .divider {
      height: 1px;
      background: #2d3748;
      margin: 20px 0;
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 24px;
    }

    button {
      padding: 9px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity 0.15s, transform 0.1s;
    }

    button:active { transform: scale(0.98); }

    .btn-primary {
      background: #3182ce;
      color: #fff;
      flex: 1;
    }

    .btn-primary:hover { opacity: 0.88; }

    .btn-secondary {
      background: #2d3748;
      color: #a0aec0;
    }

    .btn-secondary:hover { background: #374151; }

    .output-section {
      margin-top: 24px;
    }

    .output-label {
      font-size: 12px;
      font-weight: 600;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    #output {
      background: #0f1117;
      border: 1px solid #2d3748;
      border-radius: 6px;
      padding: 14px;
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 12px;
      color: #68d391;
      white-space: pre-wrap;
      min-height: 80px;
      display: none;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #276749;
      color: #c6f6d5;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.25s, transform 0.25s;
      pointer-events: none;
    }

    .toast.show { opacity: 1; transform: translateY(0); }

    .legend {
      font-size: 11px;
      color: #4a5568;
      margin-top: 10px;
    }

    .legend span { color: #e53e3e; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Environment Configuration</h1>
      <p class="subtitle">Set environment variables for your application. Values are only stored locally.</p>
    </header>

    <div class="card">
      <form id="envForm" novalidate>
        ${rows}
        <div class="divider"></div>
        <p class="legend"><span>*</span> Required field</p>
        <div class="actions">
          <button type="submit" class="btn-primary">Generate .env</button>
          <button type="button" class="btn-secondary" onclick="resetForm()">Reset</button>
        </div>
      </form>

      <div class="output-section">
        <p class="output-label" id="outputLabel" style="display:none">Generated .env</p>
        <pre id="output"></pre>
      </div>
    </div>
  </div>

  <div class="toast" id="toast">Copied to clipboard!</div>

  <script>
    const form = document.getElementById('envForm');
    const output = document.getElementById('output');
    const outputLabel = document.getElementById('outputLabel');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const lines = [];
      for (const [key, value] of data.entries()) {
        const needsQuote = /\\s|#|=/.test(String(value));
        lines.push(needsQuote ? \`\${key}="\${value}"\` : \`\${key}=\${value}\`);
      }
      const envContent = lines.join('\\n');
      output.textContent = envContent;
      output.style.display = 'block';
      outputLabel.style.display = 'block';

      if (navigator.clipboard) {
        navigator.clipboard.writeText(envContent).then(() => showToast());
      }
    });

    function resetForm() {
      form.reset();
      output.style.display = 'none';
      outputLabel.style.display = 'none';
    }

    function showToast() {
      const t = document.getElementById('toast');
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2200);
    }

    output.addEventListener('click', () => {
      if (navigator.clipboard && output.textContent) {
        navigator.clipboard.writeText(output.textContent).then(() => showToast());
      }
    });
  </script>
</body>
</html>`;
}

const ApplyEnvSchema = z.object({
  vars: z
    .record(z.string(), z.string())
    .describe("Key-value pairs of environment variables to pre-populate"),
});

const server = new Server(
  { name: "env-config-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_env_config_form",
      description:
        "Returns an interactive HTML form for configuring the application's environment variables. " +
        "The form lets users fill in values and generates a ready-to-use .env file.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "apply_env_vars",
      description:
        "Accepts a map of environment variable key-value pairs and returns a formatted .env file string.",
      inputSchema: {
        type: "object",
        properties: {
          vars: {
            type: "object",
            description: "Key-value pairs to write into the .env file",
            additionalProperties: { type: "string" },
          },
        },
        required: ["vars"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_env_config_form") {
    const html = buildEnvConfigHtml();
    return {
      content: [
        {
          type: "resource",
          resource: {
            uri: "ui://env-config-form",
            mimeType: "text/html",
            text: html,
          },
        },
      ],
    };
  }

  if (name === "apply_env_vars") {
    const { vars } = ApplyEnvSchema.parse(args as Record<string, unknown>);
    const lines = Object.entries(vars).map(([k, v]) => {
      const needsQuote = /\s|#|=/.test(v);
      return needsQuote ? `${k}="${v}"` : `${k}=${v}`;
    });
    const envFile = lines.join("\n");
    return {
      content: [
        {
          type: "text",
          text: `Generated .env file:\n\n\`\`\`\n${envFile}\n\`\`\``,
        },
      ],
    };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("env-config MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
