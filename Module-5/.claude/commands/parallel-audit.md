# Parallel Audit Command

## Purpose

Run multiple parallel agents to analyze the codebase from different perspectives and combine results into a single report.

---

## Task

Launch 3 parallel Explore agents:

### Agent 1: Security Audit

Focus:

- API vulnerabilities
- Input validation issues
- Authentication/authorization gaps
- Injection risks (SQL, XSS, etc.)

---

### Agent 2: Performance Audit

Focus:

- N+1 queries
- Missing DB indexes
- Inefficient loops
- Heavy synchronous processing
- Unnecessary API/DB calls

---

### Agent 3: Code Quality Review

Focus:

- Code duplication
- High complexity methods
- Poor naming
- Large classes/methods
- Maintainability issues

---

## Instructions

1. Run all 3 agents in parallel.
2. Each agent produces its own findings.
3. Combine all findings into a single structured report.

---

## Output Format

### Combined Audit Report

#### 🔒 Security Issues

| File | Severity | Issue | Fix |
| ---- | -------- | ----- | --- |

---

#### ⚡ Performance Issues

| File | Severity | Issue | Fix |
| ---- | -------- | ----- | --- |

---

#### 🧹 Code Quality Issues

| File | Severity | Issue | Fix |
| ---- | -------- | ----- | --- |

---

## Rules

- Avoid duplicate issues across sections
- Prioritize high-impact issues first
- Keep fixes practical and actionable
- Be concise

---

## Final Summary

- Total issues found
- High-risk areas
- Recommended next steps
