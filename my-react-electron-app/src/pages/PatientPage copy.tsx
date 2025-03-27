import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PatientPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the prediction data from the backend API
    fetch(`http://localhost:5000/api/prediction`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Prediction request failed: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        setImageUrls(data.sliceUrls);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching prediction data:', err);
        setError('Failed to fetch prediction data');
        setLoading(false);
      });
  }, []);
  
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>🧑‍⚕️ Patient: {id}</h2>

      {/* Display the images */}
      <div>
        {imageUrls?.ct?.length > 0 && (
          <div>
            <h3>CT Images:</h3>
            {imageUrls.ct.map((url: string, index: number) => (
              <img key={index} src={url} alt={`CT slice ${index}`} />
            ))}
          </div>
        )}
        {imageUrls?.dose?.length > 0 && (
          <div>
            <h3>Dose Images:</h3>
            {imageUrls.dose.map((url: string, index: number) => (
              <img key={index} src={url} alt={`Dose slice ${index}`} />
            ))}
          </div>
        )}
        {imageUrls?.prediction?.length > 0 && (
          <div>
            <h3>Prediction Images:</h3>
            {imageUrls.prediction.map((url: string, index: number) => (
              <img key={index} src={url} alt={`Prediction slice ${index}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPage;
