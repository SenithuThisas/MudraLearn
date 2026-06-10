import pathlib, json
data_root = pathlib.Path('data/archive/Dataset - MP - CSV')
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
output = {'total': len(signs), 'signs': signs}
with open('../frontend/public/signs_data.json', 'w') as f:
    json.dump(output, f, indent=2)
print(f'Written {len(signs)} signs to frontend/public/signs_data.json')
