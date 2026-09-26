"""Generate curriculum seed JSON from gate-eval CSV and production labels.

Usage:
    python3 backend/scripts/generate_curriculum_seed.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to sys.path so 'app.*' imports work
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.curriculum_builder import (
    DEFAULT_CSV,
    DEFAULT_LABEL_MAP,
    DEFAULT_SEED_JSON,
    DEFAULT_SIGNS,
    build_and_write_from_disk,
)


def main() -> None:
    print("Building curriculum seed from:")
    print(f"  CSV:        {DEFAULT_CSV}")
    print(f"  Label map:  {DEFAULT_LABEL_MAP}")
    print(f"  Signs data: {DEFAULT_SIGNS}")
    print(f"  Dest seed:  {DEFAULT_SEED_JSON}")

    payload = build_and_write_from_disk()

    signs_count = len(payload["signs"])
    batches_count = len(payload["batches"])
    unbatched_count = len(payload["unbatched_gate_passed"])

    print("Successfully generated curriculum seed!")
    print(f"  Total gate-passed signs: {signs_count}")
    print(f"  Total batches formed:    {batches_count} ({batches_count * 5} signs)")
    print(f"  Unbatched signs:         {unbatched_count}")
    print(f"  Output written to:       {DEFAULT_SEED_JSON}")


if __name__ == "__main__":
    main()
