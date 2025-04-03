from fuzzywuzzy import fuzz

intent_phrases = {
    'predict_dose': [
        "generate predicted dose", "start prediction", "predict", "dose", "run model"
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
