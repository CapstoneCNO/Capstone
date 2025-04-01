from pathlib import Path
import os

from provided_code.data_loader import DataLoader
from provided_code.dose_evaluation_class import DoseEvaluator
from provided_code.network_functions import PredictionModel
from provided_code.utils import get_paths
import time

from csv_to_image_slices import convert_patient_to_images
from display_3d import display

prediction_name = "pytorch"
epoch=200
stage="coarse"
results_dir = Path('results')
num_patients = 1

# Predicts patient's doses using ct scans and structure masks
# Makes a prediction for the first num_patients patients in patients_dir
# Dose predictions are in .csv format in prediction_paths
# Dose predictions are in 128-slice 3D image format in ourput_dir
def predict_with_masks(patients_dir, output_dir):

    patients_dir = Path(patients_dir)
    output_dir = Path(output_dir)

    # get num_patients patients
    patients = os.listdir(patients_dir)[:num_patients]

    patient_dirs = [Path(f"{patients_dir}/{pt}") for pt in patients]
    output_dirs = [f"{output_dir}/{pt}-images" for pt in patients]

    # load patients into data loader, then load model and make the predictions
    start = time.time()
    data_loader = DataLoader(patient_dirs)
    model = PredictionModel(data_loader, results_dir, model_name=prediction_name, stage=stage)
    model.predict_dose(epoch)
    end = time.time()
    print(f"{end-start:.2f} seconds to predict dose")

    start = end
    prediction_paths=[Path(f"{results_dir}/{prediction_name}/{stage}-predictions/{pt}.csv") for pt in patients]

    # convert predictions into 128-slice 3D image
    for i in range(num_patients):
        convert_patient_to_images(patient_dirs[i], output_dirs[i], prediction_paths[i])
        end = time.time()
        print(f"{end-start:.2f} seconds to convert images")
        # displays prediction for comparing with actual dose (requires actual dose)
        #display(output_dirs[i])
        start = time.time()

if __name__ == "__main__":
    # example use
    patients_dir = 'provided-data/train-pats'
    output_dir = 'predictions'
    predict_with_masks(patients_dir, output_dir)
