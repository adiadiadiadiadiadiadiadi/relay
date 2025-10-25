import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAa1DD5WWTXKibOSGlewi6k_x4VC8LTMw",
  authDomain: "stellar-auth-b5075.firebaseapp.com",
  projectId: "stellar-auth-b5075",
  storageBucket: "stellar-auth-b5075.firebasestorage.app",
  messagingSenderId: "1096294841764",
  appId: "1:1096294841764:web:c99ac4a3b16c5c216e5531"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
