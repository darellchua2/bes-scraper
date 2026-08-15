# bes-scraper

Python project. Use `.venv/` for all runs (`source .venv/bin/activate`).

## Repo rules

- Secrets live in `.env` — never commit or echo values.
- `downloads/` holds scraper output; treat as disposable data.
- always add docstrings to functions and classes

## OpenCode Rule Blocks

<!-- opencode:lsp -->
On reviews with >10-file or shared-module changes where `opencode.json` has no `lsp` key and a built-in server matches: append a one-line LSP-enable recommendation (TS/JS/Next.js → `typescript`+`eslint`; Python → `pyright`). Recommend only — never auto-edit `opencode.json`.

<!-- opencode:codegraph -->
The `codegraph_*` tools are the interface (`status` → `search`/`callers`/`callees`/`impact`/`node`/`files`). Never call `read_mcp_resource`/`list_mcp_resources` — runtime-denied (upstream tool-list bug). Main session: lightweight lookups only — never `codegraph_explore`/`codegraph_context` (flood context; spawn an explore agent).
