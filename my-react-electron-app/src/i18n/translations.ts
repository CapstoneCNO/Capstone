// Define translation strings for supported languages
export const translations = {
  // English translations
  en: {
    // General navigation
    home: "Home",
    patients: "Patients",
    search_placeholder: "Search anything...",

    // Welcome section
    welcome: "Welcome to ContourCT. Please select a patient.",
    welcome_heading: "Welcome John!",
    welcome_subtext: "Lorem ipsum lorem lorem lorem",
    get_started: "Get started",

    // Page-specific
    patient_page_title: "Patient",
    last_updated: "Last updated: 22 hours ago",
    share: "Share",
    profile: "John",
    language: "Language",

    // Services
    services: {
      ct_scan: "CT Scan",
      mri: "MRI Imaging",
      radiation: "Radiation Therapy",
    },

    // Chat + prediction UI
    send: "Send",
    predicting: "Predicting...",
    chat_with_patient: "Chat",
    enter_message: "Enter your message here...",
    generate_dose: "Generate Predicted Dose",

    // Upload messages
    upload_success: "Files uploaded successfully!",
    upload_fail: "An error occurred while uploading files.",

    // Prediction messages
    prediction_complete: "Prediction complete!",
    prediction_failed: "Prediction failed",

    // Image labels
    ct_images: "CT Images",
    dose_images: "Dose Images",
    prediction_images: "Prediction Images",

    // Button labels
    load_files: "Load Files",
    upload_files: "Upload Files",
    load_more: "Load More",
    cancel: "Cancel",

    // Patient registration form
    register_patient: "Register Patient",
    first_name: "First Name",
    enter_first_name: "Enter first name",
    last_name: "Last Name",
    enter_last_name: "Enter last name",
    upload_image: "Upload Image",
    register: "Register",
  },

  // French translations
  fr: {
    // General navigation
    home: "Accueil",
    patients: "Patients",
    search_placeholder: "Rechercher...",

    // Welcome section
    welcome: "Bienvenue sur ContourCT. Veuillez sélectionner un patient.",
    welcome_heading: "Bienvenue John !",
    welcome_subtext: "Lorem ipsum lorem lorem lorem",
    get_started: "Commencer",

    // Page-specific
    patient_page_title: "Patient",
    last_updated: "Dernière mise à jour : il y a 22 heures",
    share: "Partager",
    profile: "John",
    language: "Langue",

    // Services
    services: {
      ct_scan: "Scanographie",
      mri: "Imagerie par IRM",
      radiation: "Radiothérapie",
    },

    // Chat + prediction UI
    send: "Envoyer",
    predicting: "Prédiction...",
    chat_with_patient: "Discuter",
    enter_message: "Entrez votre message ici...",
    generate_dose: "Générer la dose prédite",

    // Upload messages
    upload_success: "Fichiers téléchargés avec succès !",
    upload_fail: "Une erreur est survenue lors du téléchargement des fichiers.",

    // Prediction messages
    prediction_complete: "Prédiction terminée !",
    prediction_failed: "Échec de la prédiction",

    // Image labels
    ct_images: "Images CT",
    dose_images: "Images de dose",
    prediction_images: "Images de prédiction",

    // Button labels
    load_files: "Charger les fichiers",
    upload_files: "Télécharger les fichiers",
    load_more: "Charger Plus",
    cancel: "Effacer",

    // Patient registration form
    register_patient: "Enregistrer le patient",
    first_name: "Prénom",
    enter_first_name: "Entrez le prénom",
    last_name: "Nom de famille",
    enter_last_name: "Entrez le nom de famille",
    upload_image: "Ajouter image",
    register: "Enregistrer",
  },
} as const;

// Type to represent available languages (e.g., "en", "fr")
export type Language = keyof typeof translations;
