import { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import Slider from '@mui/material/Slider';
import { useTopbar } from '../components/Layout';
import { useLanguage } from '../hooks/LanguageContext';
import { Button as BsButton } from 'react-bootstrap';

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
  const [message, setMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ text: string, sender: string }[]>([]);
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [showImages, setShowImages] = useState<boolean>(false);

  useEffect(() => {
    const fetchImageUrls = async () => {
      try {
        const response = await fetch(`/api/images/${id}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data: ImageUrls = await response.json();
        setImageUrls(data);
        setShowImages(true);
      } catch {
        setError('Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchImageUrls();
  }, [id]);

  useEffect(() => {
    setChatMessages([]);
  }, [id]);

  // Inject "Load Files" button into the topbar
  useEffect(() => {
    setTopbarActions(
      <BsButton
        size="sm"
        variant="primary"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        {t('load_files')}
      </BsButton>
    );
    return () => setTopbarActions(null);
  }, [setTopbarActions, t]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !id) return;

    const formData = new FormData();
    Array.from(event.target.files).forEach(file => {
      formData.append('files', file);
    });

    setChatMessages(prev => [...prev, { text: 'Uploading files...', sender: 'bot' }]);

    try {
      const response = await fetch(`/api/upload/${id}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setChatMessages(prev => [...prev, {
          text: 'Files uploaded successfully! You can now ask me to generate a prediction.',
          sender: 'bot'
        }]);
      } else {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          text: `Upload failed: ${data.message}`,
          sender: 'bot'
        }]);
      }
    } catch {
      setChatMessages(prev => [...prev, {
        text: 'Upload failed. Please try again.',
        sender: 'bot'
      }]);
    }
  };

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = async () => {
    const userMsg = message.trim();
    setChatMessages((prev) => [...prev, { text: userMsg, sender: 'user' }]);
    setMessage('');

    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg }),
    });
    const data = await res.json();

    if (data.intent === 'predict_dose' && data.score > 0.7) {
      setChatMessages((prev) => [...prev, { text: 'Generating predicted dose...', sender: 'bot' }]);
      await handleGeneratePrediction();
    } else {
      setChatMessages((prev) => [...prev, { text: 'I didn’t understand that. Try again.', sender: 'bot' }]);
    }
  };

  const handleGeneratePrediction = async () => {
    try {
      setPredicting(true);
      const response = await fetch(`/api/prediction?patient_id=${id}`, { method: 'GET' });
      const data = await response.json();

      if (response.ok) {
        setChatMessages((prev) => [
          ...prev,
          { text: 'Prediction completed. Refreshing images...', sender: 'bot' }
        ]);

        const imageResponse = await fetch(`/api/images/${id}`);
        if (!imageResponse.ok) throw new Error('Failed to reload images');
        const imageData: ImageUrls = await imageResponse.json();
        setImageUrls(imageData);
        setShowSlider(true);
      } else {
        setChatMessages((prev) => [...prev, {
          text: `Prediction failed: ${data.message || "Unknown error."}`,
          sender: 'bot'
        }]);
      }
    } catch (error) {
      console.error(error);
      setChatMessages((prev) => [...prev, { text: 'An error occurred. Please try again.', sender: 'bot' }]);
    } finally {
      setPredicting(false);
    }
  };

  const handleSliderChange = (newValue: number) => {
    setIndex(newValue);
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setMessage('');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept="image/*"
      />

      {/* Patient header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#e6f0f8',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '26px',
            color: '#001f3f',
            border: '1px solid #ccc',
          }}
        >
          <i className="bi bi-person-circle" />
        </div>
        <h2 style={{ margin: 0 }}>{t('patient_page_title')}: {id}</h2>
      </div>

      {/* Chat + Images */}
      {showImages && (
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>
            {t('chat_with_patient')}
          </div>

          <div style={{ marginBottom: '20px' }}>
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  textAlign: msg.sender === 'bot' ? 'left' : 'right',
                  margin: '10px 0',
                  backgroundColor: msg.sender === 'bot' ? '#f1f1f1' : '#53c89b',
                  padding: '10px',
                  borderRadius: '8px',
                  maxWidth: '80%',
                  marginLeft: msg.sender === 'bot' ? '10px' : '0',
                  marginRight: msg.sender === 'bot' ? '0' : '10px',
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder={t('search_placeholder')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            />
            <BsButton
              onClick={handleSendMessage}
              disabled={predicting}
              variant="success"
              size="sm"
              style={{ padding: '10px 20px' }}
            >
              {predicting ? 'Generating...' : t('send')}
            </BsButton>
            <BsButton
              onClick={handleClearChat}
              variant="secondary"
              size="sm"
              style={{ padding: '10px 20px' }}
            >
              {t('cancel')}
            </BsButton>
          </div>

          {/* Image display */}
          {showSlider && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <div style={{ width: '30%', textAlign: 'center' }}>
                  <h3>{t('ct_images')}:</h3>
                  <img
                    src={`http://localhost:5000${imageUrls.ct[index]}`}
                    alt={`CT slice ${index + 1}`}
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ width: '30%', textAlign: 'center' }}>
                  <h3>{t('dose_images')}:</h3>
                  <img
                    src={`http://localhost:5000${imageUrls.dose[index]}`}
                    alt={`Dose slice ${index + 1}`}
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ width: '30%', textAlign: 'center' }}>
                  <h3>{t('prediction_images')}:</h3>
                  <img
                    src={`http://localhost:5000${imageUrls.prediction[index]}`}
                    alt={`Prediction slice ${index + 1}`}
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              </div>

              {/* Slider */}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Slider
                  value={index}
                  min={0}
                  max={imageUrls.ct.length - 1}
                  step={1}
                  onChange={(_, newValue) => setIndex(newValue as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `Slice ${value + 1}`}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientPage;
