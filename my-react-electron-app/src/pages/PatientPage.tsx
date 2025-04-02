import { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useTopbar } from '../components/Layout';
import { useLanguage } from '../hooks/LanguageContext';

interface ImageUrls {
  ct: string[];
  dose: string[];
  prediction: string[];
}

const PatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setTopbarActions } = useTopbar();
  const { t } = useLanguage();

  const [loading, setLoading] = useState<boolean>(true);
  const [imageUrls, setImageUrls] = useState<ImageUrls>({ ct: [], dose: [], prediction: [] });
  const [index, setIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState<boolean>(false);

  useEffect(() => {
    const fetchImageUrls = async () => {
      try {
        const response = await fetch(`/api/images/${id}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data: ImageUrls = await response.json();
        setImageUrls(data);
      } catch {
        setError('Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchImageUrls();
  }, [id]);

  useEffect(() => {
    setTopbarActions(
      <Button variant="outlined" onClick={() => document.getElementById('file-input')?.click()}>
        {t("load_files")}
      </Button>
    );

    return () => setTopbarActions(null);
  }, [setTopbarActions, t]);

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const response = await fetch(`/api/prediction?patient_id=${id}`, { method: 'GET' });
      if (response.ok) {
        alert(t("prediction_complete"));
        const imageResponse = await fetch(`/api/images/${id}`);
        if (!imageResponse.ok) throw new Error('Failed to reload images');
        const imageData: ImageUrls = await imageResponse.json();
        setImageUrls(imageData);
      } else {
        const data = await response.json();
        alert(`${t("prediction_failed")}: ${data.error}`);
      }
    } catch {
      alert(t("prediction_failed"));
    } finally {
      setPredicting(false);
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !id) return;

    const formData = new FormData();
    Array.from(event.target.files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`/api/upload/${id}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert(t("upload_success"));
      } else {
        const data = await response.json();
        alert(`${t("upload_fail")}: ${data.message}`);
      }
    } catch {
      alert(t("upload_fail"));
    }
  };

  const handleSliderChange = (newValue: number) => {
    setIndex(newValue);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t("patient_page_title")}: {id}</h2>

      <input
        id="file-input"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept="image/*"
      />

      {/* Image Display */}
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {imageUrls.ct[index] && (
          <div style={{ width: '30%', textAlign: 'center' }}>
            <h3>{t("ct_images")}:</h3>
            <img
              src={`http://localhost:5000${imageUrls.ct[index]}`}
              alt={`CT slice ${index + 1}`}
              style={{ width: '100%' }}
            />
          </div>
        )}
        {imageUrls.dose[index] && (
          <div style={{ width: '30%', textAlign: 'center' }}>
            <h3>{t("dose_images")}:</h3>
            <img
              src={`http://localhost:5000${imageUrls.dose[index]}`}
              alt={`Dose slice ${index + 1}`}
              style={{ width: '100%' }}
            />
          </div>
        )}
        {imageUrls.prediction[index] && (
          <div style={{ width: '30%', textAlign: 'center' }}>
            <h3>{t("prediction_images")}:</h3>
            <img
              src={`http://localhost:5000${imageUrls.prediction[index]}`}
              alt={`Prediction slice ${index + 1}`}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Slider */}
      <Slider
        value={index}
        min={0}
        max={imageUrls.ct.length - 1}
        step={1}
        onChange={(_, newValue) => handleSliderChange(newValue as number)}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `Slice ${value + 1}`}
        style={{ marginTop: '30px', marginBottom: '10px' }}
      />

      {/* Predict Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Button
          onClick={handlePredict}
          disabled={predicting}
          variant="contained"
          color="primary"
          size="large"
        >
          {predicting ? t("predicting") : t("predict")}
        </Button>
      </div>
    </div>
  );
};

export default PatientPage;
