import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  English: {
    appName: "Scheme Sathi",
    dashboard: "Dashboard",
    voiceAssistant: "Voice Mode",
    ocrReader: "OCR Eligibility",
    officeLocator: "Office Locator",
    profile: "Profile Setup",
    admin: "Admin Console",
    compare: "Compare Schemes",
    searchPlaceholder: "Search government schemes (e.g., 'crop protection for small farmers')...",
    login: "Login",
    register: "Register",
    logout: "Logout",
    age: "Age (Years)",
    gender: "Gender",
    occupation: "Occupation",
    income: "Annual Income (₹)",
    state: "State of Residence",
    education: "Education Level",
    disability: "Disability Status",
    caste: "Social Category / Caste",
    farmer: "Are you a Farmer?",
    save: "Save Profile Settings",
    checkEligibility: "Check My Eligibility",
    favorites: "My Favorites",
    recentlyViewed: "Recently Viewed",
    applicationGuide: "Step-by-Step Guide",
    documentsRequired: "Required Documents Checklist",
    officialLink: "Visit Official Website",
    downloadPdf: "Download PDF Guide",
    feedback: "Submit Feedback",
    nearbyOffices: "Find Nearby Offices",
    popularity: "Views",
    category: "Category",
    deadline: "Application Deadline",
    comparePlaceholder: "Select schemes from the dashboard to compare them side-by-side.",
    yes: "Yes",
    no: "No",
    eligibilityCalculator: "AI Eligibility Calculator",
    chatbotGreeting: "Hi! How can I help you find government schemes today?"
  },
  Telugu: {
    appName: "స్కీమ్ సాథి",
    dashboard: "డాష్‌బోర్డ్",
    voiceAssistant: "వాయిస్ మోడ్",
    ocrReader: "పత్రాల పరిశీలన (OCR)",
    officeLocator: "కార్యాలయాల గుర్తింపు",
    profile: "ప్రొఫైల్ సెటప్",
    admin: "అడ్మిన్ కన్సోల్",
    compare: "పథకాల పోలిక",
    searchPlaceholder: "ప్రభుత్వ పథకాల కోసం వెతకండి (ఉదాహరణ: 'రైతులకు సాయం')...",
    login: "లాగిన్",
    register: "రిజిస్ట్రేషన్",
    logout: "లాగ్ అవుట్",
    age: "వయస్సు (సంవత్సరాలు)",
    gender: "లింగం",
    occupation: "వృత్తి",
    income: "వార్షిక ఆదాయం (₹)",
    state: "రాష్ట్రం",
    education: "చదువు",
    disability: "అంగవైకల్యం ఉందా?",
    caste: "కులం / సామాజిక వర్గం",
    farmer: "మీరు రైతులా?",
    save: "ప్రొఫైల్ భద్రపరచు",
    checkEligibility: "నా అర్హత తనిఖీ చేయి",
    favorites: "నాకు నచ్చినవి",
    recentlyViewed: "ఇటీవల చూసిన పథకాలు",
    applicationGuide: "దరఖాస్తు విధానం",
    documentsRequired: "కావలసిన పత్రాలు",
    officialLink: "అధికారిక వెబ్‌సైట్ సందర్శించండి",
    downloadPdf: "PDF డౌన్‌లోడ్",
    feedback: "అభిప్రాయం పంపండి",
    nearbyOffices: "సమీప ప్రభుత్వ కార్యాలయాలు",
    popularity: "వీక్షణలు",
    category: "విభాగం",
    deadline: "చివరి తేదీ",
    comparePlaceholder: "పథకాలను సరిపోల్చడానికి డాష్‌బోర్డ్ నుండి ఎంచుకోండి.",
    yes: "అవును",
    no: "కాదు",
    eligibilityCalculator: "AI అర్హత కాలిక్యులేటర్",
    chatbotGreeting: "నమస్కారం! ప్రభుత్వ పథకాలు కనుగొనడంలో నేను మీకు ఎలా సహాయపడగలను?"
  },
  Hindi: {
    appName: "स्कीम साथी",
    dashboard: "डैशबोर्ड",
    voiceAssistant: "आवाज मोड",
    ocrReader: "दस्तावेज़ ओसीआर",
    officeLocator: "कार्यालय खोजक",
    profile: "प्रोफाइल सेटिंग",
    admin: "एडमिन पैनल",
    compare: "योजनाओं की तुलना",
    searchPlaceholder: "सरकारी योजनाओं को खोजें (जैसे: 'छोटे किसानों के लिए सहायता')...",
    login: "लॉगिन",
    register: "पंजीकरण",
    logout: "लॉग आउट",
    age: "आयु (वर्ष)",
    gender: "लिंग",
    occupation: "व्यवसाय",
    income: "वार्षिक आय (₹)",
    state: "राज्य",
    education: "शिक्षा स्तर",
    disability: "विकलांगता स्थिति",
    caste: "सामाजिक श्रेणी / जाति",
    farmer: "क्या आप एक किसान हैं?",
    save: "प्रोफाइल सुरक्षित करें",
    checkEligibility: "अपनी पात्रता जांचें",
    favorites: "मेरी पसंदीदा",
    recentlyViewed: "हाल ही में देखी गई",
    applicationGuide: "आवेदन गाइड",
    documentsRequired: "आवश्यक दस्तावेज checklist",
    officialLink: "आधिकारिक वेबसाइट पर जाएं",
    downloadPdf: "पीडीएफ डाउनलोड करें",
    feedback: "प्रतिक्रिया दें",
    nearbyOffices: "नजदीकी कार्यालय खोजें",
    popularity: "दृश्य",
    category: "श्रेणी",
    deadline: "आवेदन की अंतिम तिथि",
    comparePlaceholder: "तुलना करने के लिए डैशबोर्ड से योजनाओं का चयन करें।",
    yes: "हाँ",
    no: "नहीं",
    eligibilityCalculator: "एआई पात्रता कैलकुलेटर",
    chatbotGreeting: "नमस्ते! आज मैं सरकारी योजनाएं खोजने में आपकी क्या मदद कर सकता हूँ?"
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'English';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['English']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
