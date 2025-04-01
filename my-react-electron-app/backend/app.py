from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS  # Import CORS
import subprocess
import os

app = Flask(__name__, static_folder='predictions')



# Enable CORS for the entire app
CORS(app)

is_processing = False

@app.route('/predictions/<path:filename>')
def predictions(filename):
    return send_from_directory('predictions', filename)

@app.route('/api/prediction', methods=['GET'])
def prediction():
    global is_processing
    if is_processing:
        return jsonify({'message': 'Prediction already in progress. Please wait...'}), 400

    is_processing = True
    patient_dir = os.path.join('provided-data', 'train-pats', 'pt_1')
    output_dir = os.path.join('predictions', 'pt_1-images')

    try:
        result = subprocess.run(
            ['python', 'predict.py', patient_dir, output_dir], 
            capture_output=True, text=True
        )
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        if result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, result.args)

        return jsonify({'message': 'Prediction complete', 'status': 'success'})
    except subprocess.CalledProcessError as e:
        return jsonify({'message': 'Error fetching prediction results', 'error': str(e)}), 500
    finally:
        is_processing = False


@app.route('/api/images/<patient_id>')
def get_patient_images(patient_id):
    image_data = {
        'ct': [f'/predictions/{patient_id}/ct/ct_slice_{i:03}.png' for i in range(1, 129)],
        'dose': [f'/predictions/{patient_id}/dose/dose_slice_{i:03}.png' for i in range(1, 129)],
        'prediction': [f'/predictions/{patient_id}/prediction/prediction_slice_{i:03}.png' for i in range(1, 129)]
    }
    return jsonify(image_data)


@app.route('/predictions/<patient_id>/ct/<filename>')
def serve_ct(patient_id, filename):
    return send_from_directory(os.path.join('predictions', f'{patient_id}-images', 'ct'), filename)

@app.route('/predictions/<patient_id>/dose/<filename>')
def serve_dose(patient_id, filename):
    return send_from_directory(os.path.join('predictions', f'{patient_id}-images', 'dose'), filename)

@app.route('/predictions/<patient_id>/prediction/<filename>')
def serve_prediction(patient_id, filename):
    return send_from_directory(os.path.join('predictions', f'{patient_id}-images', 'prediction'), filename)



if __name__ == '__main__':
    app.run(debug=True, port=5000)
