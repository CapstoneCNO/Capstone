import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def unravel_index(indices, shape=(128, 128, 128), order='C'):
    """
    Convert flat indices to 3D coordinates
    """
    coords = np.zeros((len(indices), 3), dtype=int)

    if order == 'C':
        coords[:, 2] = indices // (shape[0] * shape[1])
        indices = indices % (shape[0] * shape[1])
        coords[:, 1] = indices // shape[0]
        coords[:, 0] = indices % shape[0]
    else:  # 'F' order
        coords[:, 0] = indices // (shape[1] * shape[2])
        indices = indices % (shape[1] * shape[2])
        coords[:, 1] = indices // shape[2]
        coords[:, 2] = indices % shape[2]

    return coords

def load_sparse_csv(file_path, shape=(128, 128, 128)):
    """
    Load sparse CSV file and convert to dense 3D tensor
    """
    if not os.path.exists(file_path):
        return None

    # Read the CSV file
    df = pd.read_csv(file_path)

    # Initialize an empty tensor
    tensor = np.zeros(shape)

    if len(df) > 0:
        # Convert indices to coordinates
        indices = df.iloc[:, 0].values
        values = df.iloc[:, 1].values

        # Get 3D coordinates
        coords = unravel_index(indices)

        # Assign values to the tensor
        for i in range(len(indices)):
            x, y, z = coords[i]
            tensor[x, y, z] = values[i]

    return tensor

def load_patient_data(patient_dir, prediction_path):
    """
    Load all data for a patient
    """
    data = {}

    # Load CT data
    ct_path = os.path.join(patient_dir, 'ct.csv')
    if os.path.exists(ct_path):
        ct = load_sparse_csv(ct_path)
        # Clip CT values as recommended in the documentation
        if ct is not None:
            ct = np.clip(ct, 0, 4095)
        data['ct'] = ct

    # Load dose data
    dose_path = os.path.join(patient_dir, 'dose.csv')
    if os.path.exists(dose_path):
        data['dose'] = load_sparse_csv(dose_path)

    # Load dose prediction data
    if os.path.exists(prediction_path):
        data['prediction'] = load_sparse_csv(prediction_path)

    # Load possible dose mask
    #mask_path = os.path.join(patient_dir, 'possible_dose_mask.csv')
    #if os.path.exists(mask_path):
    #    data['possible_dose_mask'] = load_sparse_csv(mask_path)

    # Structure paths
    #structures = [
    #    'Brainstem', 'SpinalCord', 'RightParotid', 'LeftParotid',
    #    'Esophagus', 'Larynx', 'Mandible',
    #    'PTV56', 'PTV63', 'PTV70'
    #]

    # Load structures
    #for structure in structures:
    #    structure_path = os.path.join(patient_dir, f'{structure}.csv')
    #    if os.path.exists(structure_path):
    #        data[structure] = load_sparse_csv(structure_path)

    return data

def save_as_png_slices(tensor, output_dir, prefix, colormap='viridis', normalize=True):
    """
    Save a 3D tensor as PNG slices along the axial dimension
    """
    if tensor is None:
        return

    os.makedirs(output_dir, exist_ok=True)

    # Normalize if needed
    if normalize and np.max(tensor) > 0:
        tensor = (tensor - np.min(tensor)) / (np.max(tensor) - np.min(tensor))

    # Save slices
    for i in range(tensor.shape[2]):
        slice_img = tensor[i,:,:]   # view from the top
        #slice_img = tensor[:,i,:]  # view from the right
        #slice_img = tensor[:,:,i]  # view from the front

        # Create a new figure and axes for each slice
        fig, ax = plt.subplots(figsize=(5, 5))

        ax.imshow(slice_img, cmap=colormap) # Display on the axes object
        ax.axis('off')
        fig.tight_layout()
        fig.savefig(os.path.join(output_dir, f'{prefix}_slice_{i:03d}.png'), bbox_inches='tight', pad_inches=0)
        plt.close(fig) # Close the figure to release resources

def convert_patient_to_images(patient_dir, output_dir, prediction_path=""):
    """
    Convert a patient's training data from CSV files into 128 image slices.
    
    :param patient_dir: Path to the patient's data folder
    :param output_dir: Path to save the output images
    """
    print(f"Converting patient data from {patient_dir} to images...")
    
    # Load patient data
    data = load_patient_data(patient_dir, prediction_path)
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each data component as images
    for key, tensor in data.items():
        if tensor is None:
            continue
        
        # Choose appropriate colormap and normalization based on data type
        if key == 'ct':
            cmap = 'gray'
            norm = True
        elif key == 'dose' or key == 'prediction':
            cmap = 'jet'
            norm = True
        else:  # Structures and masks
            cmap = 'viridis'
            norm = False
        
        png_subdir = os.path.join(output_dir, key)
        save_as_png_slices(tensor, png_subdir, key, colormap=cmap, normalize=norm)
    
    print(f"Conversion complete for patient data in {patient_dir}")

def main():

    patient_dir="../open-kbp/provided-data/validation-pats/pt_202/"
    output_dir="./pt_202_images/"
    prediction_path="../open-kbp/results/100epochs/validation-predictions/pt_202.csv"

    convert_patient_to_images(patient_dir, output_dir, prediction_path)

if __name__ == "__main__":
    main()