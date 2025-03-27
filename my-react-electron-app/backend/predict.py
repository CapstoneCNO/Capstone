from pathlib import Path
import os
import time
import cv2
import numpy as np

from provided_code.data_loader import DataLoader
from provided_code.dose_evaluation_class import DoseEvaluator
from provided_code.network_functions import PredictionModel
from provided_code.utils import get_paths
from csv_to_image_slices import convert_patient_to_images
from display_3d import display

prediction_name = "pytorch"
epoch = 200
stage = "coarse"
results_dir = Path('results')
num_patients = 1

# Function to display debug information
def log_info(message):
    print(f"[INFO]: {message}")

# Predicts patient's doses using ct scans and structure masks
def predict_with_masks(patients_dir, output_dir):
    patients_dir = Path(patients_dir)
    output_dir = Path(output_dir)

    # Get num_patients patients
    patients = os.listdir(patients_dir)[:num_patients]
    log_info(f"Patients to process: {patients}")

    patient_dirs = [Path(f"{patients_dir}/{pt}") for pt in patients]
    output_dirs = [f"{output_dir}/{pt}-images" for pt in patients]

    # Load patients into data loader, then load model and make the predictions
    start = time.time()
    data_loader = DataLoader(patient_dirs)
    log_info(f"Data loader initialized for {len(patient_dirs)} patients.")
    
    model = PredictionModel(data_loader, results_dir, model_name=prediction_name, stage=stage)
    log_info(f"Prediction model {prediction_name} loaded successfully for stage {stage}.")
    
    log_info(f"Starting dose prediction for epoch {epoch}...")
    model.predict_dose(epoch)
    end = time.time()
    log_info(f"{end - start:.2f} seconds to predict dose")

    # Check prediction paths
    prediction_paths = [Path(f"{results_dir}/{prediction_name}/{stage}-predictions/{pt}.csv") for pt in patients]
    
    log_info(f"Prediction paths: {prediction_paths}")
    
    # Convert predictions into 128-slice 3D images
    for i in range(num_patients):
        log_info(f"Converting images for patient {patients[i]}...")
        convert_patient_to_images(patient_dirs[i], output_dirs[i], prediction_paths[i])
        end = time.time()
        log_info(f"{end - start:.2f} seconds to convert images")
        # Display prediction for comparing with actual dose (requires actual dose)
        # display(output_dirs[i])
        start = time.time()

if __name__ == "__main__":
    # Example use
    patients_dir = 'provided-data/train-pats'
    output_dir = 'predictions'
    log_info(f"Starting prediction process for patients in {patients_dir}")
    predict_with_masks(patients_dir, output_dir)
