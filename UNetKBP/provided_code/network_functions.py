# network_functions.py
import os
from pathlib import Path
import re

import numpy as np
import pandas as pd
import torch

from provided_code.data_loader import DataLoader
from provided_code.network_architectures import DefineDoseFromCT
from provided_code.utils import get_paths, sparse_vector_function

class PredictionModel(DefineDoseFromCT):
    def __init__(self, data_loader: DataLoader, results_patent_path: Path, model_name: str, stage: str) -> None:
        # Initialize the PyTorch network.
        super().__init__(
            data_shapes=data_loader.data_shapes,
            initial_number_of_filters=32,  # (Recommend increasing to 64+ in practice)
            filter_size=(4, 4, 4),
            stride_size=(2, 2, 2),
            padding_size=(1, 1, 1)
        )
        self.model_name = model_name
        self.data_loader = data_loader
        self.full_roi_list = data_loader.full_roi_list

        self.current_epoch = 0
        self.last_epoch = 200

        # Create directories for saving models and predictions.
        model_results_path = results_patent_path / model_name
        self.model_dir = model_results_path / "models"
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.prediction_dir = model_results_path / f"{stage}-predictions"
        self.prediction_dir.mkdir(parents=True, exist_ok=True)

        self.model_path_template = self.model_dir / "epoch_"

        # Define optimizer and loss function.
        self.optimizer = torch.optim.Adam(self.parameters(), lr=0.0001, betas=(0.5, 0.999))
        self.criterion = torch.nn.L1Loss()

    def train_model(self, epochs: int = 200, save_frequency: int = 5, keep_model_history: int = 2) -> None:
        self._set_epoch_start()
        self.last_epoch = epochs
        self.initialize_networks()
        if self.current_epoch == epochs:
            print(f"The model has already been trained for {epochs} epochs, so no more training will be done.")
            return
        self.data_loader.set_mode("training_model")
        self.train()  # Set the network to training mode

        for epoch in range(self.current_epoch, epochs):
            self.current_epoch = epoch
            print(f"Beginning epoch {self.current_epoch}")
            self.data_loader.shuffle_data()

            for idx, batch in enumerate(self.data_loader.get_batches()):
                # Convert numpy arrays from the batch to torch tensors.
                ct = torch.tensor(batch.ct, dtype=torch.float32)
                masks = torch.tensor(batch.structure_masks, dtype=torch.float32)
                dose = torch.tensor(batch.dose, dtype=torch.float32)
                ct = torch.permute(ct, (0, 4, 1, 2, 3))
                masks = torch.permute(masks, (0, 4, 1, 2, 3))
                dose = torch.permute(dose, (0, 4, 1, 2, 3))

                self.optimizer.zero_grad()
                output = self.forward(ct, masks)
                loss = self.criterion(output, dose)
                loss.backward()
                self.optimizer.step()

                print(f"Model loss at epoch {self.current_epoch} batch {idx} is {loss.item():.3f}")

            self.manage_model_storage(save_frequency, keep_model_history)

    def _set_epoch_start(self) -> None:
        all_model_paths = get_paths(self.model_dir, extension="pt")
        for model_path in all_model_paths:
            try:
                epoch_number = int(model_path.stem.split("epoch_")[-1])
                self.current_epoch = max(self.current_epoch, epoch_number)
            except ValueError:
                continue

    def initialize_networks(self) -> None:
        if self.current_epoch >= 1:
            checkpoint = torch.load(self._get_generator_path(self.current_epoch))
            self.load_state_dict(checkpoint)
        # Otherwise, the network is already initialized.

    def manage_model_storage(self, save_frequency: int = 1, keep_model_history: int = None) -> None:
        effective_epoch_number = self.current_epoch + 1  # Increment for saving.
        if effective_epoch_number % save_frequency != 0 and effective_epoch_number != self.last_epoch:
            print(f"Model at the end of epoch {self.current_epoch} was not saved because save frequency is {save_frequency}.")
            return

        checkpoint_path = self._get_generator_path(effective_epoch_number)
        torch.save(self.state_dict(), checkpoint_path)

        # If keep_model_history is set, ensure we only retain the latest models
        if keep_model_history is not None:
            all_model_paths = sorted(
                get_paths(self.model_dir, extension="pt"),
                key=lambda p: int(p.stem.split("epoch_")[-1])
            )

            # Delete older models, keeping only the latest 'keep_model_history' models
            if len(all_model_paths) > keep_model_history:
                models_to_delete = all_model_paths[:-keep_model_history]  # All but the last 'keep_model_history' models
                for old_model in models_to_delete:
                    os.remove(old_model)
                    print(f"Deleted old model: {old_model}")

    def _get_generator_path(self, epoch: int = None) -> Path:
        epoch = epoch or self.current_epoch
        return self.model_dir / f"epoch_{epoch}.pt"

    def predict_dose(self, epoch: int = 1) -> None:
        checkpoint_path = self._get_generator_path(epoch)
        self.load_state_dict(torch.load(checkpoint_path))
        os.makedirs(self.prediction_dir, exist_ok=True)
        self.data_loader.set_mode("dose_prediction")
        self.eval()  # Set model to evaluation mode

        print("Predicting dose with generator.")
        with torch.no_grad():
            for batch in self.data_loader.get_batches():
                ct = torch.tensor(batch.ct, dtype=torch.float32)
                masks = torch.tensor(batch.structure_masks, dtype=torch.float32)
                ct = torch.permute(ct, (0, 4, 1, 2, 3))
                masks = torch.permute(masks, (0, 4, 1, 2, 3))
                dose_pred = self.forward(ct, masks)
                pd_mask = torch.tensor(batch.possible_dose_mask, dtype=torch.float32)
                pd_mask = torch.permute(pd_mask, (0, 4, 1, 2, 3))
                dose_pred = dose_pred * pd_mask
                dose_pred = dose_pred.squeeze().cpu().numpy()
                dose_to_save = sparse_vector_function(dose_pred)
                dose_df = pd.DataFrame(data=dose_to_save["data"].squeeze(), 
                                       index=dose_to_save["indices"].squeeze(), 
                                       columns=["data"])
                (patient_id,) = batch.patient_list
                dose_df.to_csv(f"{self.prediction_dir}/{patient_id}.csv")
