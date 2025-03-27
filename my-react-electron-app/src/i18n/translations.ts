export const translations = {
    en: {
      home: "Home",
      patients: "Patients",
      search_placeholder: "Search anything...",
      welcome: "Welcome to ContourCT. Please select a patient.",
      patient_page_title: "Patient",
      last_updated: "Last updated",
      share: "Share",
      profile: "john",
      language: "Language",
      welcome_heading: "Welcome John!",
      welcome_subtext: "Lorem ipsum lorem lorem lorem",
      get_started: "Get started",
      services: {
        ct_scan: "CT Scan",
        mri: "MRI Imaging",
        radiation: "Radiation Therapy",
      },
    },
    fr: {
      home: "Accueil",
      patients: "Patients",
      search_placeholder: "Rechercher...",
      welcome: "Bienvenue sur ContourCT. Veuillez sélectionner un patient.",
      patient_page_title: "Patient",
      last_updated: "Dernière mise à jour",
      share: "Partager",
      profile: "John",
      language: "Langue",
      welcome_heading: "Bienvenue John !",
      welcome_subtext: "Lorem ipsum lorem lorem lorem",
      get_started: "Commencer",
      services: {
        ct_scan: "Scanographie",
        mri: "Imagerie par IRM",
        radiation: "Radiothérapie",
      },
    },
  } as const;
  
  export type Language = keyof typeof translations;
  