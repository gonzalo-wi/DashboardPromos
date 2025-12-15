/**
 * Configuración de Firebase
 */

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import config from "config";

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  databaseURL: config.firebase.databaseURL,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

console.log("🔥 Firebase Config:", {
  hasApiKey: !!firebaseConfig.apiKey,
  hasDatabaseURL: !!firebaseConfig.databaseURL,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener referencia a la base de datos
const database = getDatabase(app);

export { app, database };
export default database;
