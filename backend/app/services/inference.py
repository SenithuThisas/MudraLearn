import numpy as np
import tensorflow as tf
import json, os
from dotenv import load_dotenv

load_dotenv()

_file_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.abspath(os.path.join(_file_dir, '..', '..', '..'))

model = None
label_map = None

def load_model():
    global model, label_map
    model_path = os.getenv('MODEL_PATH', os.path.join(_project_root, 'ml', 'saved_models', 'mudralearn_model.keras'))
    label_map_path = os.getenv('LABEL_MAP_PATH', os.path.join(_project_root, 'ml', 'saved_models', 'label_map.json'))
    print(f'Loading model from {model_path}...')

    model = tf.keras.models.load_model(model_path)
    with open(label_map_path) as f:
        label_map = json.load(f)
    print(f'Model loaded. {len(label_map)} signs.')

def predict(sequence: list) -> list:
    # sequence: list of 60 frames, each frame is 126 floats
    arr = np.array(sequence, dtype=np.float32) # (60, 126)
    arr = arr.reshape(1, 60, 126) # (1, 60, 126)
    probs = model.predict(arr, verbose=0)[0] # (383,)
    # Return top 3 predictions
    top3 = np.argsort(probs)[-3:][::-1]
    return [
        {'sign': label_map[str(i)], 'confidence': round(float(probs[i]), 4)}
        for i in top3
    ]
