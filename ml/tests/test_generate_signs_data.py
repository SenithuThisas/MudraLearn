"""Validates the generated frontend/public/signs_data.json artifact.

Not a test of generate_signs_data.py's internals (the script isn't import-safe —
it runs top-level and walks the gitignored ml/data/ dataset on import) but of its
output, which is what the rest of the app actually depends on. Re-run
`python scripts/generate_signs_data.py` (from ml/) and re-run this to confirm a
regeneration didn't silently change the counts or break the tier invariant.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
SIGNS_DATA = ROOT / "frontend" / "public" / "signs_data.json"
LABEL_MAP = ROOT / "ml" / "saved_models" / "label_map.json"
REFERENCE_DIR = ROOT / "frontend" / "public" / "reference"


def _load_signs() -> list[dict]:
    return json.loads(SIGNS_DATA.read_text())["signs"]


def test_total_signs_count():
    signs = _load_signs()
    assert len(signs) == 383


def test_recognizable_count_matches_label_map():
    signs = _load_signs()
    recognizable_count = sum(1 for s in signs if s["recognizable"])
    assert recognizable_count == 204
    label_map = json.loads(LABEL_MAP.read_text())
    assert recognizable_count == len(label_map)


def test_has_clip_count_matches_reference_dir():
    signs = _load_signs()
    has_clip_count = sum(1 for s in signs if s["has_clip"])
    assert has_clip_count == 102
    clip_files = [f for f in REFERENCE_DIR.iterdir() if f.suffix == ".mp4"]
    assert has_clip_count == len(clip_files)


def test_tier_split():
    signs = _load_signs()
    has_clip = sum(1 for s in signs if s["has_clip"])
    practiceable_no_clip = sum(1 for s in signs if s["recognizable"] and not s["has_clip"])
    catalogue_only = sum(1 for s in signs if not s["recognizable"])
    assert (has_clip, practiceable_no_clip, catalogue_only) == (102, 102, 179)
    assert has_clip + practiceable_no_clip + catalogue_only == len(signs)


def test_has_clip_implies_recognizable():
    signs = _load_signs()
    violations = [s["name"] for s in signs if s["has_clip"] and not s["recognizable"]]
    assert violations == [], f"clips are not a subset of recognizable signs: {violations}"


def test_no_description_field():
    signs = _load_signs()
    expected_fields = {"name", "category", "has_clip", "recognizable"}
    for s in signs:
        assert set(s.keys()) == expected_fields
