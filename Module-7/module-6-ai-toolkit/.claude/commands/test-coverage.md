# Test Coverage Analysis Command

## Purpose

Analyze current test coverage and identify for the specific module in the project.

- Files with coverage below 80%
- High-risk areas lacking sufficient tests
- Specific test cases that should be added

---

## Instructions

1. Analyze coverage reports (JaCoCo / existing coverage output).
2. Identify all files with **coverage < 80%**.
3. Classify files by **risk level**:

   ### HIGH RISK
   - Authentication / Authorization
   - Payment processing
   - Sensitive data handling
   - External integrations (APIs, DB writes)

   ### MEDIUM RISK
   - Business logic
   - Service layer
   - Core workflows (like triggers, bulk updates)

   ### LOW RISK
   - Utility classes
   - DTOs / models
   - Simple mappings

---

## Output Format

Return results in a table:

| File | Coverage % | Risk | Missing Tests | Suggested Tests |
| ---- | ---------- | ---- | ------------- | --------------- |

---

## Rules

- Focus only on files below 80% coverage
- Prioritize HIGH risk files first
- Be specific in test suggestions (no generic advice)
- Suggest realistic unit/integration tests
- Avoid duplicate or unnecessary test suggestions

---

## Suggested Test Guidelines

For each file, suggest:

1. **Happy Path**
   - Valid inputs → expected output

2. **Edge Cases**
   - Null values
   - Empty collections
   - Boundary conditions

3. **Failure Scenarios**
   - Exceptions
   - External service failures
   - Invalid inputs

4. **Concurrency (if applicable)**
   - Parallel execution issues
   - Thread safety

---

## Example Output

| File                | Coverage % | Risk   | Missing Tests                       | Suggested Tests                                       |
| ------------------- | ---------- | ------ | ----------------------------------- | ----------------------------------------------------- |
| AuthService.java    | 45%        | HIGH   | No tests for invalid token handling | Add test for expired token, invalid token, null token |
| PaymentService.java | 60%        | HIGH   | No failure scenario tests           | Add test for payment gateway timeout and rollback     |
| AlertService.java   | 55%        | MEDIUM | Missing bulk update edge cases      | Add test for empty child alerts, partial failures     |
| StringUtil.java     | 70%        | LOW    | Missing edge cases                  | Add test for null and empty string inputs             |

---

## Notes

- Emphasize critical business flows first
- Highlight areas that can cause production failures
- Suggest integration tests where unit tests are insufficient
- Consider legacy system constraints (Spring, Hibernate, Java 8)
