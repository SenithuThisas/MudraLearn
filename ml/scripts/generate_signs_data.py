import pathlib, json, re

data_root = pathlib.Path('data/archive/Dataset - MP - CSV')
label_map_path = pathlib.Path('saved_models/label_map.json')
reference_dir = pathlib.Path('../frontend/public/reference')
output_path = pathlib.Path('../frontend/public/signs_data.json')


def slugify(name: str) -> str:
    """Sign name -> reference-clip slug.

    Mirrors referenceClipUrl() in frontend/src/services/referenceClips.ts, which is
    also duplicated in frontend/scripts/setup-reference-clips.mjs and
    backend/app/services/adaptive_engine.py::_slugify. All four must stay in sync;
    if slugs here ever look wrong, diff against those three first.
    """
    s = name.strip().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return re.sub(r'^-+|-+$', '', s)


signs = []
for category_dir in sorted(data_root.iterdir()):
    if not category_dir.is_dir(): continue
    category = category_dir.name
    for sign_dir in sorted(category_dir.iterdir()):
        if not sign_dir.is_dir(): continue
        signs.append({
            'name': sign_dir.name,
            'category': category
        })

with label_map_path.open() as f:
    label_map = json.load(f)
recognizable_slugs = {slugify(name) for name in label_map.values()}

has_clip_slugs = (
    {f.stem for f in reference_dir.iterdir() if f.suffix == '.mp4'}
    if reference_dir.is_dir() else set()
)

violations = []
for sign in signs:
    slug = slugify(sign['name'])
    sign['has_clip'] = slug in has_clip_slugs
    sign['recognizable'] = slug in recognizable_slugs
    if sign['has_clip'] and not sign['recognizable']:
        violations.append(sign['name'])

if violations:
    print('!' * 70)
    print(f'INVARIANT VIOLATED: {len(violations)} sign(s) have a clip but are NOT recognizable.')
    print('Expected nesting: clips ⊆ recognizable ⊆ catalogue (DICTIONARY_CLIPS_AUDIT_2026-08-23.md).')
    print('Violating signs:', violations)
    print('Refusing to write signs_data.json — investigate before regenerating.')
    print('!' * 70)
    raise SystemExit(1)

recognizable_count = sum(1 for s in signs if s['recognizable'])
has_clip_count = sum(1 for s in signs if s['has_clip'])

output = {'total': len(signs), 'signs': signs}
with output_path.open('w') as f:
    json.dump(output, f, indent=2)

print(f'Written {len(signs)} signs to frontend/public/signs_data.json')
print(f'  recognizable=true: {recognizable_count}')
print(f'  has_clip=true:     {has_clip_count}')
