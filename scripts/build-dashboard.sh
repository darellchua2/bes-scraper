#!/usr/bin/env bash
# Rebuild the dashboard end to end: reload Postgres from the scraped JSONL,
# then regenerate the static site in frontend/out/.
#
# Usage: scripts/build-dashboard.sh
# Requires: bes-postgres container running (localhost:5435), .venv with the
# [db] extra installed, frontend/node_modules installed.
set -euo pipefail
cd "$(dirname "$0")/.."

.venv/bin/python db/load.py
npm --prefix frontend run build

echo "Dashboard rebuilt: frontend/out/ (serve with any static file server)"
