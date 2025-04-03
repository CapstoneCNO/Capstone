import { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import Slider from '@mui/material/Slider';
import { useTopbar } from '../components/Layout';
import { useLanguage } from '../hooks/LanguageContext';
import { Button as BsButton } from 'react-bootstrap'; // Bootstrap Button import

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
        setShowImages(true); // Show images after they are loaded
      } catch {
        setError('Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchImageUrls();
  }, [id]);

  // Clear the chat when switching users
  useEffect(() => {
    setChatMessages([]); // Reset the chat messages on user switch
  }, [id]);

  useEffect(() => {
    setTopbarActions(
      <BsButton
        variant="success"
        size="sm"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        {t('load_files')}
      </BsButton>
    );

    return () => setTopbarActions(null);
  }, [setTopbarActions, t]);

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = async () => {
    // Add user's message to chat
    setChatMessages((prev) => [...prev, { text: message, sender: 'user' }]);
    setMessage(''); // Clear the input field

    // Respond with the bot message
    if (message.toLowerCase().includes('generate predicted dose')) {
      setChatMessages((prev) => [...prev, { text: 'Generating predicted dose...', sender: 'bot' }]);
      await handleGeneratePrediction();
    } else {
      setChatMessages((prev) => [...prev, { text: 'I didn\'t understand that. Try again.', sender: 'bot' }]);
    }
  };

  const handleGeneratePrediction = async () => {
    try {
      setPredicting(true);
      const response = await fetch(`/api/prediction?patient_id=${id}`, { method: 'GET' });
      const data = await response.json(); // Using the fetched data if necessary

      if (response.ok) {
        setChatMessages((prev) => [
          ...prev,
          { text: 'Prediction completed. Refreshing images...', sender: 'bot' }
        ]);

        // Fetch image URLs after prediction
        const imageResponse = await fetch(`/api/images/${id}`);
        if (!imageResponse.ok) throw new Error('Failed to reload images');
        const imageData: ImageUrls = await imageResponse.json();
        setImageUrls(imageData);  // Update state with new image URLs

        // Show the slider and images after prediction
        setShowSlider(true);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { text: 'Prediction failed. Please try again.', sender: 'bot' }
        ]);
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

  // Handle file upload status in the chatbot
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !id) return;

    const formData = new FormData();
    Array.from(event.target.files).forEach(file => {
      formData.append('files', file);
    });

    setChatMessages((prev) => [...prev, { text: 'Uploading files...', sender: 'bot' }]);

    try {
      const response = await fetch(`/api/upload/${id}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setChatMessages((prev) => [...prev, { text: 'Files uploaded successfully! What would you like me to do next?', sender: 'bot' }]);
        // Fetch image URLs after upload
        const imageResponse = await fetch(`/api/images/${id}`);
        if (!imageResponse.ok) throw new Error('Failed to reload images');
        const imageData: ImageUrls = await imageResponse.json();
        setImageUrls(imageData);  // Update image URLs state
      } else {
        const data = await response.json();
        setChatMessages((prev) => [...prev, { text: `File upload failed: ${data.message}`, sender: 'bot' }]);
      }
    } catch (error) {
      setChatMessages((prev) => [...prev, { text: 'File upload failed. Please try again.', sender: 'bot' }]);
    }
  };

  // Handle clearing the chat
  const handleClearChat = () => {
    setChatMessages([]);
    setMessage('');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{t('patient_page_title')}: {id}</h2>

      <input
        id="file-input"
        type="file"
        multiple
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileUpload} // Added file upload handler
      />

      {/* Chat Interface */}
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

          {/* Input and Send + Clear Buttons */}
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
              disabled={predicting} // Disable the button while predicting
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

          {/* Show Titles and Images after prediction inside the Chatbox */}
          {showSlider && (
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
          )}

          {/* Slider for Images */}
          {showSlider && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
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
          )}
        </div>
      )}
    </div>
  );
};

export default PatientPage;
