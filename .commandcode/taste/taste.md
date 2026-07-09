# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# code-style
- Never truncate files with "// rest remains the same"; always output complete files and split files over 300 lines into logical components. Confidence: 0.75

# workflow
See [workflow/taste.md](workflow/taste.md)

# performance
- Every module must meet performance budget: LCP < 2.5s, INP < 200ms, CLS < 0.1, virtualize/paginate data tables over 200 rows, paginate all API list endpoints server-side. Confidence: 0.75
- Score every module against 1-10 feature-depth rubric during audit passes; modules scoring below 7 are Critical priority regardless of original session focus. Confidence: 0.70

# ux
- Implement command palette (Cmd/Ctrl+K) for every major action per module with discoverable keyboard shortcuts via ? overlay. Confidence: 0.70
- Optimistic UI updates for create/update/delete with rollback on error; undo toast for destructive actions with real undo window. Confidence: 0.70

# architecture
- Build the 10 Platform Core modules as highest priority glue infrastructure: Custom Fields Engine, Global Search, DAM, Approval Workflow, Unified Inbox, Visual Workflow Builder, Public API + Webhooks, No-Code Database, E-Signature, GDPR Data Request Center. Confidence: 0.75
