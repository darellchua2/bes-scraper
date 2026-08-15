"""Export scraper state to reusable JSONL files (migration prep).

Writes data/ptw.jsonl conforming to schemas/ptw-record.schema.json from the
metadata accumulated in downloads/ptw/.state.json. No network calls.

Usage: .venv/bin/python export.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, ".")
from ptw_scraper import OUT_DIR, load_state, pdf_path  # noqa: E402

DATA_DIR = Path("data")


def export_ptw() -> int:
    """Dump every known PTW row as JSONL, one schema-shaped object per line."""
    rows, _walked = load_state()
    DATA_DIR.mkdir(exist_ok=True)
    out = DATA_DIR / "ptw.jsonl"
    n = 0
    with out.open("w") as f:
        for _id, r in rows.items():
            p = pdf_path(r)
            rec = {
                "apply_id": r["id"],
                "serial_no": r.get("ref", ""),
                "company": r.get("company", ""),
                "title": r.get("desc", ""),
                "type": r.get("type", ""),
                "date_of_application": r.get("date", ""),
                "status": r.get("status", ""),
                "pdf_file": str(p.relative_to(OUT_DIR)) if p.exists() else None,
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            n += 1
    print(f"wrote {out} ({n} records)")
    return 0


if __name__ == "__main__":
    sys.exit(export_ptw())
