#!/usr/bin/env python3
"""Extract Member(s) tables from local PTW PDFs into a nested JSONL.

Reads the pdf_file references in data/ptw.jsonl (one per permit), parses the
"Member(s)" table (S/N, ID Number, Name, Employee ID, Designation) with
pdfplumber, and appends one line per permit to downloads/ptw/members.jsonl:
{"apply_id": ..., "members": [{id_number, name, employee_id, designation}, ...]}.

Idempotent: apply_ids already present in the output are skipped (resume).
Parallelised with a process pool; CPU-bound, no network involved.
"""

import json
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import pdfplumber

PTW_JSONL = Path("data/ptw.jsonl")
OUT_JSONL = Path("downloads/ptw/members.jsonl")
PDF_ROOT = Path("downloads/ptw")


def parse_pdf(pdf_path: str) -> list[dict]:
    """Extract member rows from every Member(s) table in one PTW PDF."""
    members: list[dict] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if "Member(s)" not in text and not members:
                continue  # member section starts here or continues from before
            for table in page.extract_tables():
                if not table:
                    continue
                head = " ".join(str(c) for c in table[0] if c)
                if "ID Number" not in head or "Employee" not in head:
                    continue
                for row in table[1:]:
                    cells = [(c or "").strip() for c in row]
                    if len(cells) >= 5 and cells[1]:
                        members.append({
                            "id_number": cells[1],
                            "name": cells[2],
                            "employee_id": cells[3],
                            "designation": cells[4],
                        })
    return members


def _work(item: tuple[int, str]) -> tuple[int, list[dict]]:
    """Pool worker: parse one PDF, returning (apply_id, members)."""
    apply_id, pdf_file = item
    path = PDF_ROOT / pdf_file
    if not path.exists():
        return apply_id, []
    try:
        return apply_id, parse_pdf(str(path))
    except Exception:
        return apply_id, []  # corrupt/odd PDF: record empty, don't kill the run


def run() -> int:
    rows = [json.loads(l) for l in PTW_JSONL.read_text().splitlines() if l.strip()]
    done = set()
    if OUT_JSONL.exists():
        done = {json.loads(l)["apply_id"] for l in OUT_JSONL.read_text().splitlines() if l.strip()}
    todo = [(int(r["apply_id"]), r["pdf_file"]) for r in rows
            if r.get("pdf_file") and int(r["apply_id"]) not in done]
    print(f"{len(done)} already extracted, {len(todo)} to parse")
    if not todo:
        return 0

    with OUT_JSONL.open("a") as fh, ProcessPoolExecutor(max_workers=8) as pool:
        for i, (apply_id, members) in enumerate(pool.map(_work, todo, chunksize=8)):
            fh.write(json.dumps({"apply_id": apply_id, "members": members}) + "\n")
            if (i + 1) % 200 == 0:
                fh.flush()
                print(f"{i + 1}/{len(todo)} parsed")
    print("done")
    return 0


if __name__ == "__main__":
    sys.exit(run())
