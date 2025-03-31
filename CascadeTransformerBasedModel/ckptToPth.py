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

ckpt_path = 'checkpoints/'