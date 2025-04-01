import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Slider from '@mui/material/Slider';

interface ImageUrls {
  ct: string[];
  dose: string[];
  prediction: string[];
}

const PatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Correctly typed useParams
  const [loading, setLoading] = useState<boolean>(true);
  const [imageUrls, setImageUrls] = useState<ImageUrls>({ ct: [], dose: [], prediction: [] });
  const [index, setIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState<boolean>(false);

  // Fetch images for patient on mount
  useEffect(() => {
    const fetchImageUrls = async () => {
      try {
        const response = await fetch(`/api/images/${id}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: ImageUrls = await response.json();
        setImageUrls(data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load images');
        setLoading(false);
      }
    };

    fetchImageUrls();
  }, [id]);

// Handle prediction button click
const handlePredict = async () => {
  setPredicting(true);
  try {
    const response = await fetch('/api/prediction', { method: 'GET' });
    const data = await response.json();
    if (response.ok) {
      alert('Prediction complete!');
      
      // Fetch updated image URLs after prediction and set them using setImageUrls
      const imageResponse = await fetch(`/api/images/${id}`);
      if (!imageResponse.ok) {
        throw new Error('Failed to load images');
      }
      const imageData: ImageUrls = await imageResponse.json();
      setImageUrls(imageData); // Update image URLs in the state

    } else {
      alert(`Prediction failed: ${data.error}`);
    }
  } catch (error) {
    alert('An error occurred during prediction.');
  } finally {
    setPredicting(false);
  }
};


  // Slider change handler
  const handleSliderChange = (newValue: number) => {
    setIndex(newValue);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Patient: {id}</h2>

      {/* Predict Button */}
      <button onClick={handlePredict} disabled={predicting}>
        {predicting ? 'Predicting...' : 'Predict'}
      </button>

      {/* Display images based on the current index */}
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {imageUrls.ct[index] && (
          <div style={{ width: '30%', textAlign: 'center' }}>
            <h3>CT Images:</h3>
            <img src={`http://localhost:5000${imageUrls.ct[index]}`} alt={`CT slice ${index + 1}`} style={{ width: '100%' }} />
          </div>
        )}
        {imageUrls.dose[index] && (
          <div style={{ width: '30%', textAlign: 'center' }}>
            <h3>Dose Images:</h3>
            <img src={`http://localhost:5000${imageUrls.dose[index]}`} alt={`Dose slice ${index + 1}`} style={{ width: '100%' }} />
          </div>
        )}
        {imageUrls.prediction[index] && (
          <div style={{ width: '30%', textAlign: 'center' }}>
            <h3>Prediction Images:</h3>
            <img src={`http://localhost:5000${imageUrls.prediction[index]}`} alt={`Prediction slice ${index + 1}`} style={{ width: '100%' }} />
          </div>
        )}
      </div>

      {/* Slider for scrolling through slices */}
      <Slider
        value={index}
        min={0}
        max={imageUrls.ct.length - 1}
        step={1}
        onChange={(_, newValue) => handleSliderChange(newValue as number)}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `Slice ${value + 1}`}
      />
    </div>
  );
};

export default PatientPage;
