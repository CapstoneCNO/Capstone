const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

// Serve static files from the 'predictions' folder
app.use('/predictions', express.static(path.join(__dirname, 'predictions')));

// Endpoint to fetch prediction results (static for pt_1)
app.get('/api/prediction', (req, res) => {
  const outputDir = path.join(__dirname, 'predictions', 'pt_1');
  const imageFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.png'));
  
  const imageUrls = imageFiles.map(file => `http://localhost:5000/predictions/pt_1/${file}`);
  
  res.json({ sliceUrls: imageUrls });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
