"""Build curriculum seed from gate-eval CSV + production labels + dictionary categories.

No database access — output is a JSON-serializable dict (and optionally a file).
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

from app.services.curriculum_config import (
    MAX_SAME_CATEGORY_PER_BATCH,
    SIGNS_PER_BATCH,
    tier_for_level,
)

_PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CSV = _PROJECT_ROOT / "ml" / "saved_models" / "v2" / "per_class_report_v2.csv"
DEFAULT_LABEL_MAP = _PROJECT_ROOT / "ml" / "saved_models" / "label_map.json"
DEFAULT_SIGNS = _PROJECT_ROOT / "frontend" / "public" / "signs_data.json"
DEFAULT_SEED_JSON = Path(__file__).resolve().parents[1] / "data" / "curriculum_seed.json"


def _load_categories(signs_path: Path) -> dict[str, str]:
    payload = json.loads(signs_path.read_text())
    return {row["name"]: row["category"] for row in payload["signs"]}


def _load_production_labels(label_map_path: Path) -> set[str]:
    raw = json.loads(label_map_path.read_text())
    return set(raw.values()) if isinstance(raw, dict) else set(raw)


def load_ranked_gate_passed(
    csv_path: Path,
    label_map_path: Path,
    signs_path: Path,
) -> list[dict]:
    production = _load_production_labels(label_map_path)
    categories = _load_categories(signs_path)
    passed: list[dict] = []
    with csv_path.open() as handle:
        reader = csv.DictReader(handle)
        name_key = reader.fieldnames[0] if reader.fieldnames else ""
        for row in reader:
            name = row[name_key]
            if name in ("accuracy", "macro avg", "weighted avg") or not name:
                continue
            if name not in production:
                continue
            f1 = float(row["f1-score"])
            if f1 <= 0:
                continue
            passed.append({
                "sign_id": name,
                "f1": f1,
                "accuracy": float(row["recall"]),
                "support": float(row["support"]),
                "gate_passed": True,
                "category": categories.get(name, "Uncategorized"),
            })
    passed.sort(key=lambda s: (-s["f1"], -s["accuracy"], s["sign_id"]))
    for rank, sign in enumerate(passed, start=1):
        sign["difficulty_rank"] = rank
    return passed


def split_unbatched(ranked: list[dict], signs_per_batch: int = SIGNS_PER_BATCH) -> tuple[list[dict], list[dict]]:
    leftover = len(ranked) % signs_per_batch
    if leftover == 0:
        return ranked, []
    return ranked[:-leftover], ranked[-leftover:]


def form_batches(
    eligible: list[dict],
    signs_per_batch: int = SIGNS_PER_BATCH,
    max_same_category: int = MAX_SAME_CATEGORY_PER_BATCH,
) -> list[list[dict]]:
    """Walk F1 order, skipping a sign when the current batch already has enough of its category."""
    remaining = list(eligible)
    batches: list[list[dict]] = []
    while len(remaining) >= signs_per_batch:
        batch: list[dict] = []
        deferred: list[dict] = []
        i = 0
        while i < len(remaining) and len(batch) < signs_per_batch:
            sign = remaining[i]
            cat_count = sum(1 for s in batch if s["category"] == sign["category"])
            can_defer = cat_count >= max_same_category and any(
                sum(1 for s in batch if s["category"] == remaining[j]["category"]) < max_same_category
                for j in range(i + 1, len(remaining))
            )
            if can_defer:
                deferred.append(sign)
            else:
                batch.append(sign)
            i += 1
        remaining_after = deferred + remaining[i:]
        if len(batch) < signs_per_batch:
            filler = list(remaining_after)
            remaining_after = []
            while len(batch) < signs_per_batch and filler:
                batch.append(filler.pop(0))
            remaining_after = filler
        batches.append(batch)
        remaining = remaining_after
    return batches


def build_seed_payload(ranked: list[dict]) -> dict:
    eligible, unbatched = split_unbatched(ranked)
    grouped = form_batches(eligible)
    batches = []
    assigned: set[str] = set()
    for index, group in enumerate(grouped, start=1):
        tier_number, tier_label = tier_for_level(index)
        sign_ids = [s["sign_id"] for s in group]
        assigned.update(sign_ids)
        batches.append({
            "batch_id": index,
            "level_number": index,
            "tier": tier_number,
            "tier_label": tier_label,
            "difficulty_rank": index,
            "sign_ids": sign_ids,
        })
    signs = []
    for sign in ranked:
        row = dict(sign)
        row["in_batch"] = sign["sign_id"] in assigned
        signs.append(row)
    return {
        "source": "v2/per_class_report_v2.csv ∩ production label_map.json",
        "signs": signs,
        "batches": batches,
        "unbatched_gate_passed": [s["sign_id"] for s in unbatched],
    }


def write_seed_json(payload: dict, dest: Path = DEFAULT_SEED_JSON) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(payload, indent=2) + "\n")
    return dest


def load_seed_json(path: Path = DEFAULT_SEED_JSON) -> dict:
    return json.loads(path.read_text())


def build_and_write_from_disk(
    csv_path: Path = DEFAULT_CSV,
    label_map_path: Path = DEFAULT_LABEL_MAP,
    signs_path: Path = DEFAULT_SIGNS,
    dest: Path = DEFAULT_SEED_JSON,
) -> dict:
    ranked = load_ranked_gate_passed(csv_path, label_map_path, signs_path)
    payload = build_seed_payload(ranked)
    write_seed_json(payload, dest)
    return payload
