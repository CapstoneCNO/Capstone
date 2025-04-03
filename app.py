# app.py
# ------------------------------------------------------------------------------
# This script runs the backend server for the frontend application.
# It handles HTTP requests such as POST and GET for:
# - Uploading patient files
# - Running dose prediction models
# - Serving generated image slices
# - Handling natural language classification of user messages
# The server interacts with both the file system and prediction subprocess.
# ------------------------------------------------------------------------------

from flask import Flask, send_from_directory, jsonify, request
from intent_classifier import classify_intent, respond_to_intent
from flask_cors import CORS  
import subprocess
import os

# Initialize Flask app with static folder for serving prediction images
app = Flask(__name__, static_folder='predictions')

# Enable Cross-Origin Resource Sharing
CORS(app)

# Flag to prevent concurrent prediction processing
is_processing = False

# Endpoints aka URLs (routes)
# Endpoint for uploading patient files
@app.route('/api/upload/<patient_id>', methods=['POST'])
def upload_files(patient_id):
    upload_dir = os.path.join('new-data', 'patients', patient_id)  
    os.makedirs(upload_dir, exist_ok=True)

    if 'files' not in request.files:
        return jsonify({'message': 'No files part in the request'}), 400

    files = request.files.getlist('files')
    if not files:
        return jsonify({'message': 'No files uploaded'}), 400

    for file in files:
        file_path = os.path.join(upload_dir, file.filename)
        file.save(file_path)

    return jsonify({'message': 'Files uploaded successfully'}), 200

# Endpoint for serving prediction images statically
@app.route('/predictions/<path:filename>')
def predictions(filename):
    return send_from_directory('predictions', filename)

# Endpoint to trigger prediction processing
@app.route('/api/prediction', methods=['GET'])
def prediction():
    global is_processing
    if is_processing:
        return jsonify({'message': 'Prediction already in progress. Please wait...'}), 400

    is_processing = True
    patient_id = request.args.get('patient_id')
    if not patient_id:
        is_processing = False
        return jsonify({'message': 'Missing patient ID'}), 400

    patient_dir = os.path.join('new-data', 'patients', patient_id)
    output_dir = os.path.join('predictions', patient_id, patient_id)  # Output format: /predictions/<id>/<id>/

    # Check if uploaded data exists
    if not os.path.exists(patient_dir) or not os.listdir(patient_dir):
        is_processing = False
        return jsonify({
            'message': f"No data found for patient '{patient_id}'. Please upload files first.",
            'status': 'error'
        }), 400

    # Skip prediction if it already exists
    if os.path.exists(os.path.join(output_dir, 'prediction')):
        is_processing = False
        return jsonify({'message': 'Prediction already exists.', 'status': 'exists'})

    # Ensure output folders exist
    os.makedirs('predictions', exist_ok=True)
    os.makedirs(os.path.join('predictions', patient_id), exist_ok=True)

    # Run prediction subprocess
    try:
        result = subprocess.run(
            ['python', 'UNETKBP/predict.py', patient_dir, os.path.join('predictions', patient_id)],
            capture_output=True, text=True
        )
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)

        if result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, result.args)

        return jsonify({'message': 'Prediction complete', 'status': 'success'})
    except subprocess.CalledProcessError as e:
        return jsonify({'message': 'Prediction failed.', 'error': str(e)}), 500
    finally:
        is_processing = False

# Endpoint to retrieve all CT, dose, and prediction image URLs for a patient
@app.route('/api/images/<patient_id>')
def get_patient_images(patient_id):
    image_data = {
        'ct': [f'/predictions/{patient_id}/{patient_id}/ct/ct_slice_{i:03}.png' for i in range(1, 129)],
        'dose': [f'/predictions/{patient_id}/{patient_id}/dose/dose_slice_{i:03}.png' for i in range(1, 129)],
        'prediction': [f'/predictions/{patient_id}/{patient_id}/prediction/prediction_slice_{i:03}.png' for i in range(1, 129)]
    }
    return jsonify(image_data)

# Endpoints to serve individual image slices
@app.route('/predictions/<patient_id>/ct/<filename>')
def serve_ct(patient_id, filename):
    return send_from_directory(os.path.join('predictions', patient_id, 'ct'), filename)

@app.route('/predictions/<patient_id>/dose/<filename>')
def serve_dose(patient_id, filename):
    return send_from_directory(os.path.join('predictions', patient_id, 'dose'), filename)

@app.route('/predictions/<patient_id>/prediction/<filename>')
def serve_prediction(patient_id, filename):
    return send_from_directory(os.path.join('predictions', patient_id, 'prediction'), filename)

# Endpoint to classify natural language input and respond with intent
@app.route("/api/classify", methods=["POST"])
def classify():
    data = request.get_json()
    message = data.get("message", "")
    patient_id = data.get("patient_id", "")

    intent, score = classify_intent(message)
    extra_response = respond_to_intent(intent, patient_id) if intent == "help" else None

    return jsonify({
        "intent": intent,
        "score": score,
        "bot_response": extra_response
    })

# Run the Flask app on port 5000 in debug mode
if __name__ == '__main__':
    app.run(debug=True, port=5000)
