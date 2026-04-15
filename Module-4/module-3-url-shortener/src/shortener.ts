import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 6;
const MAX_URL_LENGTH = 2048;

const urlToCode = new Map<string, string>();
const codeToUrl = new Map<string, string>();

function validateUrl(url: string): void {
  if (!url || url.trim() === "") {
    throw new Error("Invalid URL: empty string");
  }

  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`Invalid URL: exceeds ${MAX_URL_LENGTH} character limit`);
  }

  if (/\s/.test(url)) {
    throw new Error("Invalid URL: contains whitespace");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL: failed to parse");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Invalid URL: unsupported protocol "${parsed.protocol}"`);
  }

  if (!parsed.hostname) {
    throw new Error("Invalid URL: missing hostname");
  }
}

export function shorten(url: string, codeLength: number = CODE_LENGTH): string {
  validateUrl(url);

  if (urlToCode.has(url)) {
    return urlToCode.get(url)!;
  }

  const generate = customAlphabet(ALPHABET, codeLength);
  const code = generate();
  urlToCode.set(url, code);
  codeToUrl.set(code, url);
  return code;
}

export function resolve(code: string): string | null {
  return codeToUrl.get(code) ?? null;
}
