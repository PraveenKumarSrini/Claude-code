# Pre-deployment checklist

Run this command before deploying to any environment. Work through every section in order. Do not skip sections marked BLOCKING — a failure there means the deploy should not proceed.

## 1. Environment [BLOCKING]

Check that all required environment variables are documented and set:

- Verify `JWT_SECRET` is set and is not a default/test value (must be at least 32 random characters)
- Verify `NODE_ENV=production` is set for production deployments
- Verify `PORT` matches the port the load balancer or container platform expects
- Check `CORS_ORIGIN` is set to the actual frontend origin, not `localhost`
- Check `RATE_LIMIT_MAX` is configured appropriately for expected traffic

If any required variable is missing or using a test/default value, stop here.

## 2. Type safety [BLOCKING]

```bash
npm run type-check
```

Zero errors required. TypeScript errors in production indicate runtime crashes waiting to happen.

## 3. Tests with coverage [BLOCKING]

```bash
npm test -- --coverage
```

All tests must pass. Requires `@vitest/coverage-v8` in `devDependencies` — if this package is missing, the command will fail with `MISSING DEPENDENCY` before running any tests. Verify it is present in `package.json` and `package-lock.json` is committed.

Current coverage baseline (areas with no test coverage):

- `test/tasks.test.ts` covers task CRUD and the 401 unauthenticated case
- Users routes, error handler behaviour, and logger output are not yet covered

If tests are failing, do not deploy.

## 4. Build

```bash
npm run build
```

Confirm `dist/` is produced with no TypeScript emit errors. The built output is what runs in production (`npm start` runs `node dist/index.js`).

## 5. Security audit [BLOCKING]

```bash
npm audit --audit-level=high
```

Zero high or critical vulnerabilities allowed. For moderate vulnerabilities, assess exploitability in context. Check `package-lock.json` is committed so the production install is reproducible.

## 6. Known open issues

These were identified in a security audit and are not yet fixed. Assess whether each is acceptable for this deployment:

| ID      | Severity | Description                                               |
| ------- | -------- | --------------------------------------------------------- |
| SEC-005 | High     | No Zod validation on POST/PUT /api/tasks                  |
| SEC-009 | Medium   | `req.body` spread on PUT /api/tasks/:id (mass assignment) |
| SEC-008 | Medium   | CORS middleware not wired up                              |
| SEC-007 | High     | Rate limiting not wired up                                |
| SEC-010 | Medium   | `generateId()` uses Math.random(), not crypto.randomUUID  |
| SEC-014 | Low      | No `helmet` middleware (missing HTTP security headers)    |

If SEC-005 or SEC-007 are not fixed, the API should not be exposed publicly.

## 7. Graceful shutdown

Confirm the deployment platform sends `SIGTERM` before killing the process and allows at least 10 seconds for drain. The server handles `SIGTERM` and `SIGINT` — it stops accepting connections and waits for in-flight requests before exiting. A forced exit fires after 10 s.

## 8. Logging

In production, logs are newline-delimited JSON to stdout/stderr. Confirm:

- The platform captures stdout and stderr separately
- `requestId` is indexed in your log aggregator for correlation
- No `console.log` calls exist outside the structured logger (grep for them):

```bash
grep -rn "console\." src/ --include="*.ts"
```

## 9. Health check

After deploy, hit the health endpoint (no auth required):

```bash
curl https://your-host/health
# expected: {"status":"ok","timestamp":"..."}
```

A non-200 response means the server did not start correctly.

## 10. Smoke test authenticated endpoints

Generate a short-lived token and confirm the API responds:

```bash
# Replace JWT_SECRET and payload as appropriate
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({id:'user-001',role:'admin'}, process.env.JWT_SECRET))")
curl -H "Authorization: Bearer $TOKEN" https://your-host/api/tasks
# expected: {"tasks":[...],"total":3}
```

---

If all BLOCKING checks pass and open issues are triaged, the deployment can proceed.
