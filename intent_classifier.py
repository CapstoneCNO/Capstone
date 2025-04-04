from fuzzywuzzy import fuzz
import os

# Define known phrases associated with each intent
intent_phrases = {
    'predict_dose': [
        "generate predicted dose", "start prediction", "predict", "dose", "run model"
    ],
    'help': [
        "what can i do", "i don't understand", "help", "how does this work", "what now", "what's next"
    ]
}

# Function to classify the intent of a user's message based on fuzzy matching
def classify_intent(message):
    best_match = None  # Will hold the most likely intent
    best_score = 0     # Highest fuzzy match score

    # Compare message against each phrase in each intent category
    for intent, phrases in intent_phrases.items():
        for phrase in phrases:
            score = fuzz.partial_ratio(message.lower(), phrase.lower())  # Compare ignoring case
            if score > best_score:
                best_score = score
                best_match = intent

    # Only return the intent if score is high enough (threshold = 70)
    return (best_match, best_score / 100) if best_score >= 70 else (None, 0.0)

# Function to respond appropriately to a 'help' intent
def respond_to_intent(intent, patient_id):
    # Check if the patient folder exists and has files
    patient_dir = os.path.join('new-data', 'patients', patient_id)
    has_images = os.path.exists(patient_dir) and len(os.listdir(patient_dir)) > 0

    # Custom bot response based on intent and image availability
    if intent == 'help':
        if has_images:
            return f"You’ve uploaded data for patient '{patient_id}'. I can now generate a treatment plan for you."
        else:
            return "Please upload images before starting the treatment process."
    
    return None  # For intents other than 'help'
