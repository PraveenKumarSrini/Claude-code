# Code Review Command

## Purpose

Review the specific module in the project.

- Security vulnerabilities
- Performance issues
- Code style violations
- Missing error handling
- Missing tests

---

## Instructions

1. Analyze each file carefully.

2. For every issue found, classify it into one of the categories:
   - Security
   - Performance
   - Code Style
   - Error Handling
   - Testing

3. Assign a severity level:
   - HIGH → critical bug, security risk, or production failure
   - MEDIUM → performance or maintainability issue
   - LOW → minor style or improvement

4. Suggest a clear and actionable fix.

---

## Output Format

Return results in a table with the following columns:

| File | Line | Severity | Issue | Fix |
| ---- | ---- | -------- | ----- | --- |

---

## Rules

- Only report real issues (avoid noise)
- Be concise and specific
- Prefer practical fixes over theory
- If no issues found, return: "No issues found"

---

## Example Output

| File                 | Line | Severity | Issue                                          | Fix                                          |
| -------------------- | ---- | -------- | ---------------------------------------------- | -------------------------------------------- |
| UserService.java     | 45   | HIGH     | SQL Injection risk due to string concatenation | Use PreparedStatement or parameterized query |
| OrderController.java | 78   | MEDIUM   | Missing null check on request body             | Add validation before processing             |
| Utils.java           | 12   | LOW      | Method name not following camelCase            | Rename method to follow Java conventions     |

---

## Notes

- Focus more on risky and impactful issues
- Ignore formatting-only diffs unless harmful
- Assume Java + Spring + Hibernate context
