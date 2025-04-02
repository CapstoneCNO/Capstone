from pathlib import Path
import os
import sys
import time

from provided_code.data_loader import DataLoader
from provided_code.dose_evaluation_class import DoseEvaluator
from provided_code.network_functions import PredictionModel
from provided_code.utils import get_paths
from csv_to_image_slices import convert_patient_to_images
# from display_3d import display

# Configs
prediction_name = "pytorch"
epoch = 200
stage = "coarse"
results_dir = Path("results")

def predict_single_patient(patient_dir, output_base):
    patient_dir = Path(patient_dir)
    patient_name = patient_dir.name  # e.g. "Carolina"

    output_dir = Path(output_base) / f"{patient_name}"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Initialize data loader and model
    print(f"Loading data for: {patient_name}")
    data_loader = DataLoader([patient_dir])
    model = PredictionModel(data_loader, results_dir, model_name=prediction_name, stage=stage)

    # Predict dose
    start = time.time()
    model.predict_dose(epoch)
    end = time.time()
    print(f"{end - start:.2f} seconds to predict dose")

    # Locate .csv prediction file
    prediction_csv = results_dir / prediction_name / f"{stage}-predictions" / f"{patient_name}.csv"
    if not prediction_csv.exists():
        raise FileNotFoundError(f"Prediction CSV not found at {prediction_csv}")

    # Convert to image slices
    print("Converting prediction CSV to image slices...")
    convert_patient_to_images(patient_dir, output_dir, prediction_csv)
    print(f"Prediction slices saved in: {output_dir}")

    # Optionally show visualization
    # display(output_dir)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python predict.py <patient_folder> <output_base_folder>")
        sys.exit(1)

    patient_folder = sys.argv[1]     # ex: new-data/patients/Carolina
    output_base = sys.argv[2]        # ex: predictions

    predict_single_patient(patient_folder, output_base)
