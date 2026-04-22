# Project Conventions

## Purpose

Define and standardize coding conventions across the project to ensure consistency, readability, and maintainability.

---

# 1. TypeScript Configuration

## Strict Mode

- Always enable TypeScript strict mode:
  - `"strict": true` in `tsconfig.json`

### Rules

- Avoid `any` wherever possible
- Use explicit types for function parameters and return values
- Prefer `unknown` over `any` when type is not known
- Use interfaces/types for structured data

### Example

```ts
interface User {
  id: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // implementation
}
```

---

# 2. API Response Format

## Standard Response Structure

All APIs must return a consistent format:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

### Rules

- `success`: boolean indicating operation status
- `data`: actual response payload (null if error)
- `error`: error object (null if success)
- `meta`: optional metadata (pagination, etc.)

---

## Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

# 3. Error Handling Patterns

## Backend / Service Layer

- Use centralized error handling
- Do not expose raw exceptions
- Wrap errors with meaningful messages

### Example

```ts
try {
  // logic
} catch (err) {
  throw new AppError("USER_FETCH_FAILED", "Failed to fetch user");
}
```

---

## Guidelines

- Use custom error classes (e.g., `AppError`)
- Always log errors before throwing
- Avoid silent failures
- Provide actionable error messages

Tamil:
👉 **பிழை வந்தால் மறைக்காதே — தெளிவாக சொல்ல வேண்டும்**

---

# 4. Testing Approach

## Principles

- Write tests for all business logic
- Prioritize critical flows:
  - Auth
  - Payments
  - Data updates

---

## Test Types

### Unit Tests

- Test individual functions/services
- Mock dependencies

### Integration Tests

- Test API endpoints and DB interactions

---

## Coverage

- Maintain minimum **80% coverage**
- Focus on:
  - Edge cases
  - Failure scenarios
  - Null/empty inputs

---

## Example

```ts
it("should throw error for invalid input", () => {
  expect(() => service.process(null)).toThrow();
});
```

---

# 5. Naming Conventions

## General Rules

- Use meaningful and descriptive names
- Avoid abbreviations unless standard

---

## Variables & Functions

- camelCase

```ts
const userName = "John";
function calculateTotal() {}
```

---

## Classes & Interfaces

- PascalCase

```ts
class UserService {}
interface UserResponse {}
```

---

## Constants

- UPPER_CASE

```ts
const MAX_RETRY_COUNT = 3;
```

---

## Files & Folders

- kebab-case or lowercase

```bash
user-service.ts
auth-controller.ts
```

---

# 6. Code Style

- Keep functions small and focused
- Avoid deep nesting
- Prefer early returns

### Example

```ts
if (!user) return null;
```

---

# 7. Logging

- Log important operations
- Use structured logging
- Avoid logging sensitive data

---

# 8. Documentation

- Add comments for complex logic
- Use JSDoc for public methods

---

# Notes

- Follow existing code patterns when in doubt
- Consistency is more important than perfection
- Review PRs against these conventions
