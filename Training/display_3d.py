import cv2
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.widgets as widgets
import glob

index = 0

def display(patient_folder):

    # load images
    ct_image_files = sorted(glob.glob(patient_folder + "/ct/*slice*.png"))
    ct_images = [cv2.cvtColor(cv2.imread(img, cv2.IMREAD_GRAYSCALE), cv2.COLOR_GRAY2RGB) for img in ct_image_files]

    dose_image_files = sorted(glob.glob(patient_folder + "/dose/*slice*.png"))
    dose_images = [cv2.cvtColor(cv2.imread(img, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB) for img in dose_image_files]

    prediction_image_files = sorted(glob.glob(patient_folder + "/prediction/*slice*.png"))
    prediction_images = [cv2.cvtColor(cv2.imread(img, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB) for img in prediction_image_files]

    num_slices = 128

    # create figure and axes to plot images
    fig, ax = plt.subplots(1, 3, figsize=(8, 6))
    plt.subplots_adjust(left=0.2, bottom=0.1, right=0.95, top=0.9)

    # display initial images
    ct_display = ax[0].imshow(ct_images[index])
    ax[0].set_title(f"CT slice {index}")
    ax[0].axis('off')

    dose_display = ax[1].imshow(dose_images[index], cmap='jet')
    ax[1].set_title(f"Dose slice {index}")
    ax[1].axis('off')

    prediction_display = ax[2].imshow(prediction_images[index], cmap='jet')
    ax[2].set_title(f"Prediction slice {index}")
    ax[2].axis('off')

    # add a vertical scroll bar
    ax_slider = plt.axes([0.05, 0.1, 0.03, 0.8])
    slider = widgets.Slider(ax_slider, "Slice", 0, num_slices - 1, valinit=index, orientation="vertical")

    # update images
    def update(val):
        global index
        index = int(slider.val)
        
        # update images
        ct_display.set_data(ct_images[index])
        dose_display.set_data(dose_images[index])
        prediction_display.set_data(prediction_images[index])

        # Update titles
        ax[0].set_title(f"CT slice {index}")
        ax[1].set_title(f"Dose slice {index}")
        ax[2].set_title(f"Prediction slice {index}")

        fig.canvas.draw_idle() # redraw with updated images

    def on_scroll(event):
        global index
        if event.step > 0:
            index = min(index + 1, num_slices - 1)
        else:
            index = max(index - 1, 0)

        slider.set_val(index)

    slider.on_changed(update)
    fig.canvas.mpl_connect('scroll_event', on_scroll)
    plt.show()

if __name__ == "__main__":
    
    patient_folder = "./pt_202_images/"
    display(patient_folder)
