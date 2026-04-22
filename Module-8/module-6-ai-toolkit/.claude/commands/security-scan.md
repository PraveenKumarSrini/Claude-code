# Security audit

Perform a thorough security audit of this codebase. Work through every category below, inspect the actual source files, and produce a findings report. Do not guess — read the code.

## What to inspect

### Source files to read

- `src/index.ts` — middleware order, what is and isn't protected
- `src/middleware/auth.ts` — token verification logic
- `src/middleware/errorHandler.ts` — what leaks in error responses
- `src/middleware/logger.ts` — what gets logged (PII risk)
- `src/routes/tasks.ts` — input handling on every endpoint
- `src/routes/users.ts` — password handling, response serialisation, role assignment
- `src/utils/helpers.ts` — ID generation, validation logic
- `src/types.ts` — data shapes, required vs optional fields
- `package.json` — dependency versions
- `.github/workflows/ci.yml` — CI security stage config

### Run these checks

```bash
# Dependency vulnerabilities
npm audit --audit-level=moderate

# Hardcoded secrets, tokens, or credentials
grep -rn "secret\|password\|api.key\|token\|private" src/ --include="*.ts" -i | grep -v "JWT_SECRET\|hashSync\|bcrypt\|process\.env\|stripPassword\|isValidEmail\|SEED_HASH"

# console.log usage outside structured logger
grep -rn "console\." src/ --include="*.ts"

# Any dynamic require() calls (module injection risk)
grep -rn "require(" src/ --include="*.ts"

# Raw req.body usage without validation
grep -rn "req\.body" src/ --include="*.ts"

# Direct res.json with error objects (potential stack trace leak)
grep -rn "res\..*json.*err\|res\..*json.*stack\|res\..*json.*Error" src/ --include="*.ts"
```

## Categories to check

### Authentication and authorisation

- Is `authMiddleware` applied to every route that needs it?
- Is there any route that bypasses auth unintentionally?
- Does `req.user` get used for ownership checks, or are all authenticated users treated equally?
- Can a `member` role user access or modify resources owned by others?
- Is there a login endpoint? If not, how are tokens issued?

### Input validation

For every `POST` and `PUT` handler, check:

- Is a Zod schema (or equivalent) applied before the body is used?
- Can `status` or `priority` be set to arbitrary strings that violate the `Task` type union?
- Is `tags` validated as an array of strings?
- Can `assigneeId` reference a non-existent user?
- Is `PUT /:id` using `...req.body` spread (mass assignment)?

### Password and credential handling

- Are passwords hashed with bcrypt before storage? What cost factor?
- Is `password` stripped from every response shape (`GET /`, `GET /:id`, `POST /`)?
- Is there a hardcoded default password anywhere?
- Are seed user credentials committed to source in plaintext?
- Is `JWT_SECRET` read from `process.env` only, never hardcoded?

### Information disclosure

- Do error responses in production include stack traces or internal file paths?
- Does the `logger` emit PII (emails, names, passwords) in request logs?
- Do 404 responses reveal whether a resource exists vs. is forbidden?
- Does the health endpoint expose version, environment, or dependency info?

### Injection and XSS

- Is any user input passed to `eval`, `Function()`, `exec`, `spawn`, or `execSync`?
- Is any user input inserted into HTML or SQL strings without escaping?
- Are there any template literals that embed `req.body` values directly into strings returned to the client?

### CORS and HTTP headers

- Is the `cors` package installed and configured with `CORS_ORIGIN` from env?
- Is `helmet` applied for security headers (`X-Content-Type-Options`, `X-Frame-Options`, CSP, etc.)?
- Does `Access-Control-Allow-Origin: *` appear anywhere?

### Rate limiting

- Is `express-rate-limit` (or equivalent) applied?
- Are auth-adjacent routes (`POST /api/users`) limited more strictly than read routes?
- Is `RATE_LIMIT_MAX` from env actually consumed by the middleware?

### ID generation

- Is `generateId()` in `src/utils/helpers.ts` using `Math.random()`?
- Are IDs predictable enough to enable enumeration or IDOR attacks?

### Dependency supply chain

Review `npm audit` output and note:

- Any critical or high severity CVEs in direct dependencies
- Any direct dependencies with known prototype pollution issues
- Whether `package-lock.json` is committed (reproducible installs)

## Report format

For each finding, report:

```
ID:          SEC-XXX (continue numbering from SEC-015)
File:        src/path/to/file.ts:line
Severity:    critical | high | medium | low
Description: What the issue is and why it matters
Fix:         Specific code change or pattern to apply
```

Group findings by severity (critical first). After the findings list, provide:

1. **Fixed since last audit** — issues from the original audit (SEC-001 through SEC-015) that are now resolved
2. **Still open** — issues from the original audit not yet fixed
3. **New findings** — anything discovered in this scan not in the original audit
4. **Overall risk rating** — critical / high / medium / low with one-sentence justification

## Known baseline

The following were fixed as of the last audit pass:

- SEC-001 — passwords no longer returned in responses (`stripPassword` applied to all user endpoints)
- SEC-002 — bcrypt (cost 12) applied on `POST /api/users`; seed data uses `hashSync` (cost 10) at module load
- SEC-004 — `authMiddleware` applied to `/api/tasks` and `/api/users` routers

The following are still open and expected to appear in findings:

- SEC-005 — no Zod validation on `POST /api/tasks` or `PUT /api/tasks/:id`
- SEC-007 — no rate limiting wired up
- SEC-008 — no CORS middleware wired up
- SEC-009 — `req.body` spread on `PUT /api/tasks/:id`
- SEC-010 — `generateId()` uses `Math.random()`
- SEC-014 — no `helmet` middleware
