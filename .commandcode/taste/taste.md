# code-style
- Never truncate files with "// rest remains the same"; always output complete files and split files over 300 lines into logical components. Confidence: 0.75

# workflow
See [workflow/taste.md](workflow/taste.md)

# performance
- Every module must meet performance budget: LCP < 2.5s, INP < 200ms, CLS < 0.1, virtualize/paginate data tables over 200 rows, paginate all API list endpoints server-side. Confidence: 0.75
- Score every module against 1-10 feature-depth rubric during audit passes; modules scoring below 7 are Critical priority regardless of original session focus. Confidence: 0.70
- Load test every module with actual tools (not guesses) at 50, 100, 200, and 500 concurrent users; measure response time, CPU, RAM, PostgreSQL, Redis, and PM2 metrics. Confidence: 0.70

# ux
- Implement command palette (Cmd/Ctrl+K) for every major action per module with discoverable keyboard shortcuts via ? overlay. Confidence: 0.70
- Optimistic UI updates for create/update/delete with rollback on error; undo toast for destructive actions with real undo window. Confidence: 0.70

# quality
See [quality/taste.md](quality/taste.md)
# data
- Every module must include realistic demo/seed data (e.g., contacts, invoices, employees, projects) so it looks alive from the start — demo data is one of the biggest improvements for perceived quality. Confidence: 0.80

# architecture
See [architecture/taste.md](architecture/taste.md)

# operations
- Production verification: independently verify every claim from reports against live server state using shell commands, DNS lookups, database queries, and codebase analysis; compare backups vs live state; correct assumptions that don't match evidence. Confidence: 0.75
- Production deliverables: produce two artifacts per audit — a status report documenting verified current state, and an owner action checklist with prioritized step-by-step instructions including exact CLI commands. Confidence: 0.75
