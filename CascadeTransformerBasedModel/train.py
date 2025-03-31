import DosePrediction.Train.config as config
import gc
from typing import Optional


from monai.data import DataLoader, list_data_collate

import pytorch_lightning as pl
from pytorch_lightning.callbacks.model_checkpoint import ModelCheckpoint
from pytorch_lightning.loggers import MLFlowLogger

import bitsandbytes as bnb

from DosePrediction.Models.Networks.dose_pyfer import *
from DosePrediction.DataLoader.dataloader_OpenKBP_monai import get_dataset
from DosePrediction.Evaluate.evaluate_openKBP import *
from DosePrediction.Train.loss import GenLoss
import torch
print("CUDA Available:", torch.cuda.is_available())
print("GPU Count:", torch.cuda.device_count())
print("GPU Name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No GPU detected")

os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
torch.backends.cudnn.benchmark = True
class OpenKBPDataModule(pl.LightningDataModule):
    def __init__(self):
        super().__init__()
        self.train_data = None
        self.val_data = None

    def setup(self, stage: Optional[str] = None):
        # Assign train/val datasets for use in dataloaders
        self.train_data = get_dataset(path=config.MAIN_PATH + config.TRAIN_DIR, state='train',
                                      size=200, cache=False, crop_flag=False)

        self.val_data = get_dataset(path=config.MAIN_PATH + config.VAL_DIR, state='val',
                                    size=40,
                                    #size = 3,
                                    cache=False)

    def train_dataloader(self):
        return DataLoader(self.train_data, batch_size=config.BATCH_SIZE, shuffle=True,
                          #num_workers=10,
                        #persistent_workers=True,
                         num_workers=config.NUM_WORKERS, 
                          collate_fn=list_data_collate, pin_memory=True)

    def val_dataloader(self):
        return DataLoader(self.val_data, batch_size=1, shuffle=False,
                          num_workers=config.NUM_WORKERS,
                          #num_workers=0,
                        #persistent_workers=True,
                          pin_memory=True)
class TestOpenKBPDataModule(pl.LightningDataModule):
    def __init__(self):
        super().__init__()
        self.test_data = None  # ✅ Add this to ensure proper initialization

    def setup(self, stage: Optional[str] = None):
        print("📂 Setting up test dataset...")
        self.test_data = get_dataset(
            path=config.MAIN_PATH + config.VAL_DIR, state='test',
            size=100,
            #size=3, 
            cache=True
        )

        if not self.test_data:
            raise ValueError("❌ Test dataset is empty! Check dataset path and files.")

    def test_dataloader(self):
        if self.test_data is None:
            raise ValueError("❌ Test dataset is not initialized. Run setup() first.")

        print(f"✅ Loading test dataset with {len(self.test_data)} samples.")
        return DataLoader(
            self.test_data, batch_size=1, shuffle=False,
            num_workers=config.NUM_WORKERS, pin_memory=True
        )

class Pyfer(pl.LightningModule):
    def __init__(
            self,
            config_param,
            freeze=True
    ):
        super().__init__()
        self.config_param = config_param
        self.freeze = freeze
        self.save_hyperparameters()

        # OAR + PTV + CT => dose

        self.model_, inside = create_pretrained_unet(
            in_ch=9, out_ch=1,
            list_ch_A=[-1, 16, 32, 64, 128, 256],
            ckpt_file='PretrainedModels/C3D_bs4_iter80000.pkl',
            feature_size=16,
            img_size=(config.IMAGE_SIZE, config.IMAGE_SIZE, config.IMAGE_SIZE),
            #num_layers=8,  # 4, 8, 12
            num_layers = 12,
            num_heads=6,  # 3, 6, 12
            act=config_param["act"],
            mode_multi_dec=True,
            multiS_conv=config_param["multiS_conv"], )

        if freeze:
            for n, param in self.model_.named_parameters():
                if 'net_A' in n or 'conv_out_A' in n:
                    param.requires_grad = False

        self.lr = config_param["lr"]
        self.weight_decay = config_param["weight_decay"]

        self.loss_function = GenLoss()
        self.eps_train_loss = 0.01

        self.best_average_val_index = -99999999.
        self.average_val_index = None
        self.metric_values = []

        self.best_average_train_loss = 99999999.
        self.moving_train_loss = None
        self.train_epoch_loss = []

        self.max_epochs = 100
        self.check_val = 5
        self.warmup_epochs = 1

        self.img_height = config.IMAGE_SIZE
        self.img_width = config.IMAGE_SIZE
        self.img_depth = config.IMAGE_SIZE

        self.sw_batch_size = config.SW_BATCH_SIZE

        self.list_DVH_dif = []
        self.list_dose_metric = []
        self.dict_DVH_dif = {}
        self.ivs_values = []
        self.test_step_outputs = []  # ✅ Ensures test outputs are always initialized


    def forward(self, x):
        return self.model_(x)

    def training_step(self, batch, batch_idx):
        torch.cuda.empty_cache()
        input_ = batch['Input'].float()
        target = batch['GT']

        output = self(input_)
        torch.cuda.empty_cache()

        loss = self.loss_function(output, target, casecade=True, freez=self.freeze,
                                delta1=self.config_param['delta1'], delta2=self.config_param['delta2'])

        # Store output for use in on_train_epoch_end()
        if not hasattr(self, "training_step_outputs"):
            self.training_step_outputs = []
        self.training_step_outputs.append({"loss": loss})

        return {"loss": loss}



    def on_train_epoch_end(self):
        torch.cuda.empty_cache()
        train_mean_loss = torch.stack([x["loss"] for x in self.training_step_outputs]).mean()
        
        if train_mean_loss < self.best_average_train_loss:
            self.best_average_train_loss = train_mean_loss
        
        self.train_epoch_loss.append(train_mean_loss.detach().cpu().numpy())
        
        self.logger.log_metrics({"train_mean_loss": train_mean_loss}, self.current_epoch + 1)


        # ✅ Print progress
        print(f"📉 Epoch {self.current_epoch+1}/{self.max_epochs} - Train Loss: {train_mean_loss:.4f}")

        torch.cuda.empty_cache()
        self.training_step_outputs = []  # Reset outputs for next epoch



    def validation_step(self, batch_data, batch_idx):
        torch.cuda.empty_cache()
        input_ = batch_data["Input"].float()
        target = batch_data["GT"]
        gt_dose = np.array(target[:, :1, :, :, :].cpu())
        possible_dose_mask = np.array(target[:, 1:, :, :, :].cpu())

        prediction = self.forward(input_)

        torch.cuda.empty_cache()
        loss = self.loss_function(prediction[1][0], target, mode='val', casecade=True, freez=self.freeze)

        prediction_b = np.array(prediction[1][0].cpu())

        mask = np.logical_or(possible_dose_mask < 1, prediction_b < 0)
        prediction_b[mask] = 0
        dose_score = 70. * get_3D_Dose_dif(prediction_b.squeeze(0), gt_dose.squeeze(0),
                                        possible_dose_mask.squeeze(0))

        # Store output for on_validation_epoch_end()
        if not hasattr(self, "validation_step_outputs"):
            self.validation_step_outputs = []
        self.validation_step_outputs.append({"val_loss": loss, "val_metric": dose_score})

        return {"val_loss": loss, "val_metric": dose_score}


    def on_validation_epoch_end(self):
        torch.cuda.empty_cache()

        if not hasattr(self, "validation_step_outputs") or len(self.validation_step_outputs) == 0:
            print("⚠️ No validation outputs collected, skipping metric computation.")
            return

        avg_loss = torch.stack([x["val_loss"] for x in self.validation_step_outputs]).mean()
        mean_dose_score = np.stack([x["val_metric"] for x in self.validation_step_outputs]).mean()  # ✅ Removed negative sign

        if mean_dose_score > self.best_average_val_index:
            self.best_average_val_index = mean_dose_score
        self.metric_values.append(mean_dose_score)

        # ✅ Correct logging format
        # self.logger.log_metrics("mean_dose_score", mean_dose_score, prog_bar=True, logger=True)
        # self.logger.log_metrics("val_loss", avg_loss, prog_bar=True, logger=True)
        self.log("mean_dose_score", mean_dose_score, prog_bar=True, logger=True)
        self.log("val_loss", avg_loss, prog_bar=True, logger=True)

        # ✅ Print values for debugging
        print(f"📊 Validation - Loss: {avg_loss:.4f} | Dose Score: {mean_dose_score:.4f}")

        torch.cuda.empty_cache()
        self.validation_step_outputs = []  # Reset outputs for next epoch




    def configure_optimizers(self):
        optimizer = bnb.optim.Adam8bit(self.model_.parameters(), lr=self.lr,
                                       weight_decay=self.weight_decay)
        return optimizer

    def test_step(self, batch_data, batch_idx):
        torch.cuda.empty_cache()
        
        input_ = batch_data["Input"].float()
        target = batch_data["GT"]

        gt_dose = target[:, :1, :, :, :].cpu()
        possible_dose_mask = target[:, 1:, :, :, :].cpu()

        # 🔥 Fix: Ensure mask is boolean
        possible_dose_mask = possible_dose_mask > 0  # ✅ Convert mask to boolean

        prediction = self.forward(input_)
        prediction = prediction[1][0].cpu()

        # 🔥 Fix: Ensure correct mask type
        mask = torch.logical_or(possible_dose_mask < 1, prediction < 0)  # 🔥 Use PyTorch logical OR
        prediction[mask] = 0  # ✅ Correct boolean mask usage


        prediction = 70. * prediction  # Scale prediction

        try:
            dose_dif, dvh_dif, self.dict_DVH_dif, ivs_values = get_Dose_score_and_DVH_score_batch(
                prediction, batch_data, list_DVH_dif=self.list_DVH_dif, dict_DVH_dif=self.dict_DVH_dif,
                ivs_values=self.ivs_values
            )
            self.list_DVH_dif.append(dvh_dif)

            torch.cuda.empty_cache()

            save_results = True
            if save_results and batch_idx < 100:
                print(f"✅ Saving results for batch {batch_idx}")

                ckp_re_dir = os.path.join("YourSampleImages/DosePrediction", "ours_model")
                os.makedirs(ckp_re_dir, exist_ok=True)  # ✅ Ensure directory exists

                # Post-processing and evaluation
                gt_dose[possible_dose_mask < 1] = 0

                predicted_img = torch.permute(prediction[0].cpu(), (1, 0, 2, 3))
                gt_img = torch.permute(gt_dose[0], (1, 0, 2, 3))
                name_p = batch_data['file_path'][0].split("/")[-2]

                save_dir = os.path.join(ckp_re_dir, f"{name_p}_{batch_idx}")
                os.makedirs(save_dir, exist_ok=True)

                for i in range(len(predicted_img)):
                    predicted_i = predicted_img[i][0].numpy()
                    gt_i = 70. * gt_img[i][0].numpy()
                    error = np.abs(gt_i - predicted_i)

                    fig, axs = plt.subplots(3, 1, figsize=(6, 12))
                    plt.subplots_adjust(wspace=0, hspace=0.3)

                    # Display Ground Truth with label
                    axs[0].imshow(gt_i, cmap='jet')
                    axs[0].set_title("Ground Truth Dose", fontsize=14, fontweight="bold")
                    axs[0].axis('off')

                    # Display Prediction with label
                    axs[1].imshow(predicted_i, cmap='jet')
                    axs[1].set_title("Predicted Dose", fontsize=14, fontweight="bold")
                    axs[1].axis('off')

                    # Display Error Map with label
                    axs[2].imshow(error, cmap='jet')
                    axs[2].set_title(f"Error Map | Loss: {dose_dif:.4f}", fontsize=14, fontweight="bold")
                    axs[2].axis('off')

                    fig.savefig(os.path.join(save_dir, f"{i}.jpg"), bbox_inches="tight")

                    plt.close(fig)  # ✅ Prevents memory leaks

                    torch.cuda.empty_cache()

                del batch_data
                del prediction
                gc.collect()

            self.list_dose_metric.append(dose_dif)
            result = {"dose_dif": dose_dif}  # ✅ Store test results in dictionary
            self.test_step_outputs.append(result)  # ✅ Append result to list

            return result


        except Exception as e:
            print(f"❌ Error in test_step batch {batch_idx}: {e}")
            return {"dose_dif": None}


    def on_test_epoch_end(self):
        torch.cuda.empty_cache()

        if not hasattr(self, "test_step_outputs") or self.test_step_outputs is None:
            self.test_step_outputs = []  # ✅ Ensures it's initialized properly


        if len(self.test_step_outputs) == 0:
            print("⚠️ No test results collected. Skipping metric computation.")
            return

        try:
            mean_dose_metric = np.stack([x["dose_dif"] for x in self.test_step_outputs if x["dose_dif"] is not None]).mean()
            std_dose_metric = np.stack([x["dose_dif"] for x in self.test_step_outputs if x["dose_dif"] is not None]).std()
            mean_dvh_metric = np.mean(self.list_DVH_dif) if len(self.list_DVH_dif) > 0 else None

            print(f"📊 Mean Dose Metric: {mean_dose_metric:.4f}")
            print(f"📊 Std Dose Metric: {std_dose_metric:.4f}")
            if mean_dvh_metric is not None:
                print(f"📊 Mean DVH Metric: {mean_dvh_metric:.4f}")
            
            # print('----------------------Difference DVH for each structure---------------------')
            # print(self.dict_DVH_dif)

            self.log("mean_dose_metric", mean_dose_metric)
            self.log("std_dose_metric", std_dose_metric)

        except Exception as e:
            print(f"❌ Error in on_test_epoch_end(): {e}")

        # Reset outputs for next test run
        self.test_step_outputs = []



def main(freeze=True, delta1=10, delta2=8, run_id=None, run_name=None, ckpt_path=None):
    # Initialise the LightningModule
    if ckpt_path is None:
        ckpt_path = "checkpoints"  # Default directory for saving checkpoints
    
    openkbp_ds = OpenKBPDataModule()

    # 🔥 Ensure datasets are initialized before using DataLoader
    print("🔍 Running OpenKBPDataModule.setup()...")
    openkbp_ds.setup()  # ✅ This loads train_data and val_data properly

    # 🔥 Test if DataLoader is working before training starts
    print("🔍 Testing DataLoader...")
    try:
        train_loader = openkbp_ds.train_dataloader()  # ✅ Moved after setup() call
        batch = next(iter(train_loader))
        print("✅ Successfully loaded a batch!")
        print("Batch Keys:", batch.keys())  # Should print: dict_keys(['Input', 'GT'])
    except Exception as e:
        print("❌ DataLoader Error:", e)
        return  # Stop execution if there's an error

    config_param = {
        "act": 'mish',
        "multiS_conv": True,
        "lr": 0.0006130697604327541,
        'weight_decay': 0.00016303111017674179,
        'delta1': delta1,
        'delta2': delta2,
    }
    net = Pyfer(
        config_param,
        freeze=freeze
    )

    # Set up checkpoints

    checkpoint_callback = ModelCheckpoint(
        dirpath=ckpt_path,
        filename="{epoch}-{mean_dose_score:.4f}",  # ✅ Saves every epoch with epoch number & val_loss
        monitor="mean_dose_score", mode="min",  # ✅ Saves only the model with the LOWEST val_loss (best model)
        save_top_k=3,  # ✅ Keeps ONLY the best model (deletes older worse ones)
        #save_last=True,  # ✅ Still saves the last model for reference
        auto_insert_metric_name=True,
    )

    # Set up logger
    if run_name is None:
        mlflow_logger = MLFlowLogger(
            experiment_name='EXPERIMENT_NAME',
            tracking_uri="file:./mlruns",  # Save MLflow runs locally
            run_id=run_id
        )
    else:
        mlflow_logger = MLFlowLogger(
            experiment_name='EXPERIMENT_NAME',
            tracking_uri="file:./mlruns",
            run_name=run_name
        )

    # Initialise Lightning's trainer.
    trainer = pl.Trainer(
        num_sanity_val_steps=0,  # ✅ Disables sanity check
        devices=[0],
        accelerator="gpu",
        max_epochs=net.max_epochs,
        #check_val_every_n_epoch=net.check_val,
        check_val_every_n_epoch=1,
        callbacks=[checkpoint_callback],
        logger=mlflow_logger,
        default_root_dir=ckpt_path,
        enable_progress_bar=True,
        reload_dataloaders_every_n_epochs=1,  # ✅ Prevents multiprocessing deadlocks
        deterministic=True  # ✅ Ensures consistent behavior
    )

    # Train
    train_loader = openkbp_ds.train_dataloader()

    print("🔍 Checking DataLoader batches...")
    for i, batch in enumerate(train_loader):
        print(f"✅ Loaded batch {i+1} successfully!")
        if i == 2:  # Stop after 3 batches
            break

    trainer.fit(net, datamodule=openkbp_ds)
    

    # After training
    test_data_module = TestOpenKBPDataModule()
    test_data_module.setup()  # ✅ Ensure dataset is initialized before use

    config_param = {
        "act": 'mish',
        "multiS_conv": True,
        "lr": 0.0006130697604327541,
        'weight_decay': 0.00016303111017674179,
        'delta1': 10,
        'delta2': 8,
    }
    
    # 🔍 Find best model checkpoint
    # 🔍 Find best model checkpoint
    print(f"🔍 Available Checkpoints: {os.listdir(ckpt_path)}")  # ✅ Debug info

    best_model_path = checkpoint_callback.best_model_path
    checkpoint = torch.load(best_model_path, map_location = "cuda")
    model_weights = checkpoint["state_dict"]
    pth_path = "checkpoints/best_model.pth"
    torch.save(model_weights, pth_path)
    
    if not best_model_path or not os.path.exists(best_model_path):
        print("⚠️ No best model found, using last saved model.")
        best_model_path = os.path.join(ckpt_path, "last.ckpt")  # ✅ Use last.ckpt as fallback

    # ✅ Ensure checkpoint file exists before loading
    if os.path.exists(best_model_path):
        print(f"🔄 Loading Best Model for Testing: {best_model_path}")
        net = Pyfer.load_from_checkpoint(best_model_path, config_param=config_param, freeze=True)

    else:
        print(f"❌ Error: No valid checkpoint found at {best_model_path}!")


    # ✅ Ensure test is called correctly
    trainer = pl.Trainer(
        devices=[0],
        accelerator="gpu",
        max_epochs=net.max_epochs,
        #check_val_every_n_epoch=net.check_val,
        check_val_every_n_epoch=1,
        logger=mlflow_logger,
        enable_progress_bar=True,
        reload_dataloaders_every_n_epochs=1,  # ✅ Prevents multiprocessing deadlocks
        deterministic=True  # ✅ Ensures consistent behavior
    )

    print("🧪 Running model test...")
    trainer.test(net, datamodule=test_data_module)  # ✅ Use the correct test datamodule


    return net
import torch.multiprocessing as mp
mp.set_start_method('fork', force=True)  # Ensures compatibility on Windows
torch.cuda.empty_cache()
net_ = main()