const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');  // Import CORS

const app = express();
const port = 5000;

let isProcessing = false;

// Use CORS to allow requests from your frontend's origin
app.use(cors({
  origin: 'http://localhost:5173', // Allow the frontend to access this server
}));

app.use('/predictions', express.static(path.join(__dirname, 'predictions')));

// Function to run the python script
function runPredictionScript(patientDir, outputDir) {
  return new Promise((resolve, reject) => {
    console.log("Running predict.py script...");
    exec(`python predict.py ${patientDir} ${outputDir}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        reject(`Error fetching prediction results: ${error.message}`);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(`Error fetching prediction results: ${stderr}`);
      }

      console.log(`stdout: ${stdout}`);
      resolve();  // Resolve when script finishes
    });
  });
}

function getImageUrls(outputDir) {
  const imagePaths = {
    ct: [],
    dose: [],
    prediction: []
  };

  const subdirectories = ['ct', 'dose', 'prediction'];

  subdirectories.forEach(subdir => {
    const subDirPath = path.join(outputDir, subdir);
    if (fs.existsSync(subDirPath)) {
      const files = fs.readdirSync(subDirPath).filter(file => file.endsWith('.png'));
      files.forEach(file => {
        imagePaths[subdir].push(`http://localhost:5000/predictions/pt_1-images/${subdir}/${file}`);
      });
    }
  });

  return imagePaths;
}

app.get('/api/prediction', async (req, res) => {
  console.log("Prediction request received...");
  if (isProcessing) {
    console.log("Prediction already in progress. Please wait...");
    return res.status(400).send({ error: 'Prediction already in progress. Please wait...' });
  }

  isProcessing = true;

  const patientDir = path.join(__dirname, 'provided-data', 'train-pats', 'pt_1');
  const outputDir = path.join(__dirname, 'predictions', 'pt_1-images');  

  try {
    await runPredictionScript(patientDir, outputDir);
    const imageUrls = getImageUrls(outputDir);

    if (imageUrls.ct.length === 0 && imageUrls.dose.length === 0 && imageUrls.prediction.length === 0) {
      return res.status(404).send("Prediction images not found.");
    }

    res.json({ sliceUrls: imageUrls });

  } catch (error) {
    res.status(500).send(error);
  } finally {
    isProcessing = false;
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
