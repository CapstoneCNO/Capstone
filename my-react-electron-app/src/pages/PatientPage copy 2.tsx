import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Slider from '@mui/material/Slider';

const PatientPage = () => {
  const { id } = useParams(); // Get the dynamic patient ID from the URL
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically generate paths for the CT, dose, and prediction images
    const ctImages = [];
    const doseImages = [];
    const predictionImages = [];

    // Loop to generate image URLs for slices (assuming 128 slices per patient)
    for (let i = 0; i < 128; i++) {
      // Format the slice index to be zero-padded (001, 002, etc.)
      const formattedIndex = (i + 1).toString().padStart(3, '0');
      
      // Dynamically fetching from the backend's predictions folder via public URL
      ctImages.push(`http://localhost:5000/predictions/${id}-images/ct/ct_slice_${formattedIndex}.png`);
      doseImages.push(`http://localhost:5000/predictions/${id}-images/dose/dose_slice_${formattedIndex}.png`);
      predictionImages.push(`http://localhost:5000/predictions/${id}-images/prediction/prediction_slice_${formattedIndex}.png`);
    }

    // Set the image URLs after loading them
    setImageUrls({ ct: ctImages, dose: doseImages, prediction: predictionImages });
    setLoading(false);
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleSliderChange = (event: any, newValue: number) => {
    setIndex(newValue);  // Update the slider index
  };

  return (
    <div>
      <h2>🧑‍⚕️ Patient: {id}</h2>

      {/* Display images based on the current index */}
      <div>
        {imageUrls?.ct?.length > 0 && (
          <div>
            <h3>CT Images:</h3>
            <img src={imageUrls.ct[index]} alt={`CT slice ${index + 1}`} />
          </div>
        )}
        {imageUrls?.dose?.length > 0 && (
          <div>
            <h3>Dose Images:</h3>
            <img src={imageUrls.dose[index]} alt={`Dose slice ${index + 1}`} />
          </div>
        )}
        {imageUrls?.prediction?.length > 0 && (
          <div>
            <h3>Prediction Images:</h3>
            <img src={imageUrls.prediction[index]} alt={`Prediction slice ${index + 1}`} />
          </div>
        )}
      </div>

      {/* Slider for scrolling through slices */}
      <Slider
        value={index}
        min={0}
        max={127}  // Adjust this based on the number of slices (128 slices in this case)
        step={1}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `Slice ${value + 1}`}
      />
    </div>
  );
};

export default PatientPage;
