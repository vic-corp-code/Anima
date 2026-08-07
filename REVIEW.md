# Review guidance

- Treat client validation as UX only. Validate every caller-controlled value at the backend mutation boundary, including internal/admin variants and every write path; keep derived UI calculations shared rather than reimplementing them. (PR #177)
- For async forms, audit re-entry beyond button clicks (especially Enter-key submits), and inspect multi-mutation ordering for partial commits and retry duplication. Prefer one atomic mutation when the operation represents one user action. (PRs #184, #185)
- When adding an error or loading state, trace every sibling query that can fail first. Ensure the component can actually reach the branch rather than throwing earlier; use a consistent query result/status model across the shared failure boundary. (PRs #183, #182)
- Preserve locale context on navigation: review router imports and destination construction whenever a page uses locale-prefixed routes. (PR #173)
- For shared UI or token work, search all consumers and app/package resolution contexts. Avoid parallel constants/configuration; when changing package-internal import aliases, verify every consuming app's path/export resolution. (PRs #186, #171, #166)
- Treat accessibility and state semantics as end-to-end concerns: verify keyboard reachability, label/control association, focus behavior, and read-only states against the server's allowed transitions—not just the rendered happy path. (PRs #167, #180, #184)
- When a diff removes or renames UI, audit both locale catalogs for orphaned keys and both directions of key parity; don't delete strings that are intentionally reserved for an explicitly scoped follow-up. (PRs #167, #182, #175)
- Check comments, documentation, and acceptance claims against the implementation, including complete CSS declarations and boundary cases; correct arithmetic and avoid treating adjacent/sample cases as proof of all-pairs behavior. (PRs #162, #188)
- Keep review findings proportional to scope: distinguish a real correctness regression from an intentional product trade-off or deferred design decision, and record the latter rather than repeatedly blocking on it. (PRs #184, #180)
