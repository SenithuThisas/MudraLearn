import pathlib

VERSION = "v6"

# Directory paths
DATA_DIR = pathlib.Path(f"../data/hand_{VERSION}")
MODEL_DIR = pathlib.Path(f"../saved_models/{VERSION}")
ROOT_MODEL_DIR = pathlib.Path("../saved_models")

# File names
LABEL_MAP_NAME = f"label_map_{VERSION}.json"
CANDIDATE_MODEL_NAME = f"mudralearn_{VERSION}_candidate.keras"
FINAL_PROD_MODEL_NAME = "mudralearn_model.keras"
FINAL_PROD_REPORT_NAME = "per_class_report.csv"
