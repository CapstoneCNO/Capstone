# network_architectures.py
import torch
import torch.nn as nn
import torch.nn.functional as F

from provided_code.data_shapes import DataShapes

class DefineDoseFromCT(nn.Module):
    def __init__(
        self,
        data_shapes: DataShapes,
        initial_number_of_filters: int,
        filter_size: tuple[int, int, int],
        stride_size: tuple[int, int, int],
        padding_size: tuple[int, int, int],
    ):
        super(DefineDoseFromCT, self).__init__()
        self.data_shapes = data_shapes
        self.initial_number_of_filters = initial_number_of_filters
        self.filter_size = filter_size
        self.stride_size = stride_size

        # Determine input channels.
        ct_channels = data_shapes.ct[-1]
        mask_channels = data_shapes.structure_masks[-1]
        in_channels = ct_channels + mask_channels

        # Encoder
        self.conv1 = nn.Sequential(
            nn.Conv3d(in_channels, initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.LeakyReLU(negative_slope=0.2, inplace=True)
        )
        self.conv2 = nn.Sequential(
            nn.Conv3d(initial_number_of_filters, 2 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(2 * initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.LeakyReLU(negative_slope=0.2, inplace=True)
        )
        self.conv3 = nn.Sequential(
            nn.Conv3d(2 * initial_number_of_filters, 4 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(4 * initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.LeakyReLU(negative_slope=0.2, inplace=True)
        )
        self.conv4 = nn.Sequential(
            nn.Conv3d(4 * initial_number_of_filters, 8 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(8 * initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.LeakyReLU(negative_slope=0.2, inplace=True)
        )
        self.conv5 = nn.Sequential(
            nn.Conv3d(8 * initial_number_of_filters, 8 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(8 * initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.LeakyReLU(negative_slope=0.2, inplace=True)
        )
        # Note: No batch normalization in the last encoder layer
        self.conv6 = nn.Sequential(
            nn.Conv3d(8 * initial_number_of_filters, 8 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.LeakyReLU(negative_slope=0.2, inplace=True)
        )

        # Decoder (the deconvolution blocks expect the skip connections to be concatenated beforehand)
        self.deconv5 = nn.Sequential(
            nn.ConvTranspose3d(8 * initial_number_of_filters, 8 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(8 * initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.Dropout3d(p=0.0),
            nn.LeakyReLU(negative_slope=0.0, inplace=True)
        )
        # For deconv4, the input channels double because of concatenation (skip connection).
        self.deconv4 = nn.Sequential(
            nn.ConvTranspose3d(8 * initial_number_of_filters * 2, 8 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(8 * initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.Dropout3d(p=0.2),
            nn.LeakyReLU(negative_slope=0.0, inplace=True)
        )
        self.deconv3 = nn.Sequential(
            nn.ConvTranspose3d(8 * initial_number_of_filters * 2, 4 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(4 * initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.Dropout3d(p=0.0),
            nn.LeakyReLU(negative_slope=0.0, inplace=True)
        )
        self.deconv2 = nn.Sequential(
            nn.ConvTranspose3d(4 * initial_number_of_filters * 2, 2 * initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(2 * initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.Dropout3d(p=0.2),
            nn.LeakyReLU(negative_slope=0.0, inplace=True)
        )
        self.deconv1 = nn.Sequential(
            nn.ConvTranspose3d(2 * initial_number_of_filters * 2, initial_number_of_filters, kernel_size=filter_size, stride=stride_size, padding=padding_size, bias=False),
            nn.BatchNorm3d(initial_number_of_filters, eps=1e-3, momentum=0.99),
            nn.Dropout3d(p=0.0),
            nn.LeakyReLU(negative_slope=0.0, inplace=True)
        )
        # Final layer: after concatenating with x1, the number of channels doubles.
        self.final_deconv = nn.ConvTranspose3d(initial_number_of_filters * 2, 1, kernel_size=filter_size, stride=stride_size, padding=padding_size)
        self.avg_pool = nn.AvgPool3d(kernel_size=3, stride=1, padding=1)
        self.final_activation = nn.ReLU()

    def forward(self, ct_image, roi_masks):
        x = torch.cat([ct_image, roi_masks], dim=1)
        x1 = self.conv1(x)
        x2 = self.conv2(x1)
        x3 = self.conv3(x2)
        x4 = self.conv4(x3)
        x5 = self.conv5(x4)
        x6 = self.conv6(x5)

        x5b = self.deconv5(x6)
        x4b = self.deconv4(torch.cat([x5b, x5], dim=1))
        x3b = self.deconv3(torch.cat([x4b, x4], dim=1))
        x2b = self.deconv2(torch.cat([x3b, x3], dim=1))
        x1b = self.deconv1(torch.cat([x2b, x2], dim=1))
        x0b = torch.cat([x1b, x1], dim=1)
        x0b = self.final_deconv(x0b)
        x_final = self.avg_pool(x0b)
        final_dose = self.final_activation(x_final)
        return final_dose