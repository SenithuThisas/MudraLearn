import pathlib
import json

CSV_ROOT      = pathlib.Path("data/archive/Dataset - Hand - CSV")
EXCLUDED_PATH = pathlib.Path("saved_models/v3/excluded_classes_v2.json")
OUTPUT_PATH   = pathlib.Path("../frontend/public/signs_data.json")

with open(EXCLUDED_PATH) as f:
    excluded = set(json.load(f))

signs, skipped = [], []
for category_dir in sorted(CSV_ROOT.iterdir()):
    if not category_dir.is_dir():
        continue
    category = category_dir.name
    for sign_dir in sorted(category_dir.iterdir()):
        if not sign_dir.is_dir():
            continue
        name = sign_dir.name
        if name in excluded:
            skipped.append(name)
            continue
        signs.append({"name": name, "category": category})

output = {"total": len(signs), "signs": signs}
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_PATH, "w") as f:
    json.dump(output, f, indent=2)

print(f"Written {len(signs)} signs to {OUTPUT_PATH}")
print(f"Excluded {len(skipped)} signs (below training threshold)")
