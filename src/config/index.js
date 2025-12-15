/**
 * Configuración centralizada para variables de entorno
 * Todas las variables de entorno del proyecto se acceden a través de este archivo
 */

const config = {
  // Google Maps
  googleMaps: {
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  },

  // API
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api",
    useMockData: process.env.REACT_APP_USE_MOCK_DATA === "true",
  },

  // Firebase
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  },
};

export default config;
