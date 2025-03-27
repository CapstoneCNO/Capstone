const express = require('express');
const path = require('path');
const { exec } = require('child_process'); // To run the predict.py script dynamically

const app = express();
const port = 5000;

let isProcessing = false;  // Flag to prevent concurrent requests

// Serve static files from the 'predictions' folder
app.use('/predictions', express.static(path.join(__dirname, 'predictions')));

// Function to run the Python prediction script
function runPredictionScript(patientDir, outputDir) {
  return new Promise((resolve, reject) => {
    console.log("Running predict.py script...");

    // Run the predict.py script
    exec(`python3 predict.py ${patientDir} ${outputDir}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        reject(`Error fetching prediction results: ${error.message}`);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(`Error fetching prediction results: ${stderr}`);
      }

      // Log the output for further inspection
      console.log(`stdout: ${stdout}`);

      resolve();  // Resolve when script finishes
    });
  });
}

// Endpoint to trigger prediction and serve the result
app.get('/api/prediction', async (req, res) => {
  console.log("Prediction request received...");
  
  // Prevent multiple concurrent predictions
  if (isProcessing) {
    console.log("Prediction already in progress. Please wait...");
    return res.status(400).send("Prediction already in progress. Please wait...");
  }

  // Mark as processing
  isProcessing = true;

  const patientDir = path.join(__dirname, 'provided-data', 'train-pats', 'pt_1');  // Adjust to dynamic if necessary
  const outputDir = path.join(__dirname, 'predictions', 'pt_1-images');  // Correct folder name
  
  try {
    // Wait for the prediction script to finish
    await runPredictionScript(patientDir, outputDir);

    // Send a successful response when the prediction is complete
    res.json({ message: "Prediction complete", status: "success" });

  } catch (error) {
    // Send error response if prediction fails
    res.status(500).send(error);
  } finally {
    // Mark as not processing, allow new requests
    isProcessing = false;
  }
});

// Listen for incoming requests on the specified port
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
