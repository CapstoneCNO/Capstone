import cv2
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.widgets as widgets
import glob

index = 0

# Displays a plot showing the ct scan, gt dose, and dose prediction
# images are displayed as 2D slices which can be simultaneously scrolled through
def display(patient_folder):

    plots = 0   # track how many images to plot
    plot_index = 0  # index for these plots

    # load images in the right order and format
    ct_image_files = sorted(glob.glob(patient_folder + "/ct/*slice*.png"))
    ct_images = [cv2.cvtColor(cv2.imread(img, cv2.IMREAD_GRAYSCALE), cv2.COLOR_GRAY2RGB) for img in ct_image_files]
    if ct_images != []: plots = plots + 1

    dose_image_files = sorted(glob.glob(patient_folder + "/dose/*slice*.png"))
    dose_images = [cv2.cvtColor(cv2.imread(img, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB) for img in dose_image_files]
    if dose_images != []: plots = plots + 1

    prediction_image_files = sorted(glob.glob(patient_folder + "/prediction/*slice*.png"))
    prediction_images = [cv2.cvtColor(cv2.imread(img, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB) for img in prediction_image_files]
    if prediction_images != []: plots = plots + 1

    num_slices = 128

    # create figure and axes to plot images
    fig, ax = plt.subplots(1, plots, figsize=(8, 6))
    plt.subplots_adjust(left=0.2, bottom=0.1, right=0.95, top=0.9)

    # display initial images and set titles if they exist
    if ct_images != []:
        ct_display = ax[plot_index].imshow(ct_images[index])
        ax[plot_index].set_title(f"CT slice {index}")
        ax[plot_index].axis('off')
        plot_index = plot_index + 1

    if dose_images != []:
        dose_display = ax[plot_index].imshow(dose_images[index], cmap='jet')
        ax[plot_index].set_title(f"Dose slice {index}")
        ax[plot_index].axis('off')
        plot_index = plot_index + 1

    if prediction_images != []:
        prediction_display = ax[plot_index].imshow(prediction_images[index], cmap='jet')
        ax[plot_index].set_title(f"Prediction slice {index}")
        ax[plot_index].axis('off')

    # add a vertical scroll bar
    ax_slider = plt.axes([0.05, 0.1, 0.03, 0.8])
    slider = widgets.Slider(ax_slider, "Slice", 0, num_slices - 1, valinit=index, orientation="vertical")

    # update images on scroll
    def update(val):
        global index
        index = int(slider.val)
        
        # update images with new index
        plot_index = 0
        if ct_images != []:
            ct_display.set_data(ct_images[index])
            ax[plot_index].set_title(f"CT slice {index}")
        if dose_images != []:
            dose_display.set_data(dose_images[index])
            ax[plot_index].set_title(f"Dose slice {index}")
        if prediction_images != []:
            prediction_display.set_data(prediction_images[index])
            ax[plot_index].set_title(f"Prediction slice {index}")

        fig.canvas.draw_idle() # redraw with updated images

    # update index value based on vertical scrolling
    def on_scroll(event):
        global index
        if event.step > 0:
            index = min(index + 1, num_slices - 1)
        else:
            index = max(index - 1, 0)

        slider.set_val(index)

    # associate update() and on_scroll() functions with slider and the scroll event
    slider.on_changed(update)
    fig.canvas.mpl_connect('scroll_event', on_scroll)
    plt.show()

if __name__ == "__main__":
    
    # example use with this file structure:
    # pt_202_images/ct/ct_slice_***.png
    # pt_202_images/dose/dose_slice_***.png
    # pt_202_image/prediction/prediction_slice_***.png
    patient_folder = "./pt_202_images/"
    display(patient_folder)
