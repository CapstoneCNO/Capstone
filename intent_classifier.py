from fuzzywuzzy import fuzz
import os

intent_phrases = {
    'predict_dose': [
        "generate predicted dose", "start prediction", "predict", "dose", "run model"
    ],
    'help': [
        "what can i do", "i don't understand", "help", "how does this work", "what now", "what's next"
    ]
}

def classify_intent(message):
    best_match = None
    best_score = 0

    for intent, phrases in intent_phrases.items():
        for phrase in phrases:
            score = fuzz.partial_ratio(message.lower(), phrase.lower())
            if score > best_score:
                best_score = score
                best_match = intent

    return (best_match, best_score / 100) if best_score >= 70 else (None, 0.0)


def respond_to_intent(intent, patient_id):
    patient_dir = os.path.join('new-data', 'patients', patient_id)
    has_images = os.path.exists(patient_dir) and len(os.listdir(patient_dir)) > 0

    if intent == 'help':
        if has_images:
            return f"You’ve uploaded data for patient '{patient_id}'. I can now generate a treatment plan for you."
        else:
            return "Please upload images before starting the treatment process."
    return None
