import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  // For production, use service account key
  // For development, you can use a service account JSON file
  // or initialize with app credentials
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Fallback for development - you'll need to set this up properly
    // Get from Firebase Console > Project Settings > Service Accounts
    console.warn('⚠️ Firebase Admin not initialized. Please set FIREBASE_SERVICE_ACCOUNT env var.');
  }
}

// Middleware to verify Firebase ID tokens
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to request
    req.firebaseUser = decodedToken;
    req.firebaseUid = decodedToken.uid;
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default admin;

