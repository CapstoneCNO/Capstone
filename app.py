from flask import Flask, send_from_directory, jsonify, request
from intent_classifier import classify_intent
from flask_cors import CORS  
import subprocess
import os

app = Flask(__name__, static_folder='predictions')



# Enable CORS for the entire app
CORS(app)

is_processing = False

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

@app.route('/predictions/<path:filename>')
def predictions(filename):
    return send_from_directory('predictions', filename)

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
    output_dir = os.path.join('predictions', f'{patient_id}')

    # Check if patient folder exists and has files
    if not os.path.exists(patient_dir) or not os.listdir(patient_dir):
        is_processing = False
        return jsonify({
            'message': f"No data found for patient '{patient_id}'. Please upload files first.",
            'status': 'error'
        }), 400

    os.makedirs('predictions', exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    try:
        result = subprocess.run(
            ['python', 'UNETKBP/predict.py', patient_dir, output_dir],
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




@app.route('/api/images/<patient_id>')
def get_patient_images(patient_id):
    image_data = {
        'ct': [f'/predictions/{patient_id}/{patient_id}/ct/ct_slice_{i:03}.png' for i in range(1, 129)],
        'dose': [f'/predictions/{patient_id}/{patient_id}/dose/dose_slice_{i:03}.png' for i in range(1, 129)],
        'prediction': [f'/predictions/{patient_id}/{patient_id}/prediction/prediction_slice_{i:03}.png' for i in range(1, 129)]
    }
    return jsonify(image_data)


@app.route('/predictions/<patient_id>/ct/<filename>')
def serve_ct(patient_id, filename):
    return send_from_directory(os.path.join('predictions', patient_id, 'ct'), filename)

@app.route('/predictions/<patient_id>/dose/<filename>')
def serve_dose(patient_id, filename):
    return send_from_directory(os.path.join('predictions', patient_id, 'dose'), filename)

@app.route('/predictions/<patient_id>/prediction/<filename>')
def serve_prediction(patient_id, filename):
    return send_from_directory(os.path.join('predictions', patient_id, 'prediction'), filename)


@app.route("/api/classify", methods=["POST"])
def classify():
    data = request.get_json()
    message = data.get("message", "")
    intent, score = classify_intent(message)
    return jsonify({"intent": intent, "score": score})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
