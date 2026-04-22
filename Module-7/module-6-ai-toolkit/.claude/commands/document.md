# Project Documentation Command

## Purpose

## Generate clear and structured documentation for a specific module in the project.

## Instructions

1. Identify the target module (based on user input or context).

2. Analyze:
   - Package structure
   - Key classes and their responsibilities
   - Public methods and workflows
   - Dependencies (services, repositories, external systems)

3. Focus on:
   - Business purpose
   - Data flow
   - Key logic (especially triggers, workflows, bulk operations)

---

## Output Format

### 1. Module Overview

- What this module does
- Where it is used
- Key responsibilities

---

### 2. Architecture & Components

| Component | Type                   | Responsibility |
| --------- | ---------------------- | -------------- |
| ClassName | Service/Controller/DAO | Description    |

---

### 3. Key Workflows

Describe important flows step-by-step:

#### Example:

- User triggers action
- Service processes request
- DB update happens
- Triggers execute
- External systems updated (Jira, AE, etc.)

---

### 4. Data Flow

Explain how data moves:

Input → Processing → Output

Include:

- Request objects
- Transformations
- DB interactions

---

### 5. Important Methods

For each critical method:

- Method Name:
- Purpose:
- Key Logic:
- Side Effects (DB update, triggers, API calls):

---

### 6. Dependencies

List all dependencies:

- Internal services
- External systems (Jira, ODIN, etc.)
- Frameworks (Spring, Hibernate)

---

### 7. Risks & Observations

Highlight:

- Performance risks
- Trigger-heavy areas
- Concurrency issues
- Transaction concerns

---

### 8. Suggested Improvements

- Code-level improvements
- Architecture suggestions
- Performance optimizations
- Test coverage gaps

---

## Rules

- Keep explanations simple and practical
- Avoid unnecessary theory
- Focus on real behavior (not just structure)
- Highlight legacy constraints (Java 8, Hibernate, etc.)

---

## Example Output (Short)

### Module Overview

Handles bulk update of alerts and propagates changes to child alerts.

### Architecture

| Component    | Type    | Responsibility        |
| ------------ | ------- | --------------------- |
| AlertService | Service | Handles alert updates |
| FormService  | Service | Persists form data    |

### Key Workflow

- Parent alert updated
- Child alerts fetched
- Each child updated
- Triggers executed
- Jira updated

### Risks

- Uses parallelStream → trigger overload
- No batching → performance issue

---

## Notes

- Prioritize clarity over completeness
- Explain like onboarding a new developer
- Include trigger behavior if present
