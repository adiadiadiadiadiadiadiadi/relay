# Stellar Project

A React application with Firebase authentication featuring a home page, sign up, and login pages.

## Features

- 🔐 Firebase Authentication
- 🏠 Home page with user authentication status
- 📝 User sign up functionality
- 🔑 User login functionality
- 🎨 Clean, modern UI design
- 📱 Responsive design

## Setup Instructions

### 1. Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication in the Firebase console:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the web app icon or add a new web app
   - Copy the Firebase configuration object

### 2. Update Firebase Configuration

Replace the placeholder values in `src/firebase.ts` with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.tsx     # Firebase authentication context
├── pages/
│   ├── Home.tsx            # Home page component
│   ├── Login.tsx          # Login page component
│   └── SignUp.tsx         # Sign up page component
├── firebase.ts            # Firebase configuration
└── App.tsx                # Main app component with routing
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Usage

1. **Home Page (`/`)**: Shows welcome message and authentication status
   - If logged in: Displays user email and logout button
   - If not logged in: Shows login and sign up buttons

2. **Sign Up Page (`/signup`)**: Create a new account
   - Enter email and password
   - Confirm password
   - Click "Sign Up" to create account

3. **Login Page (`/login`)**: Sign in to existing account
   - Enter email and password
   - Click "Log In" to authenticate

## Technologies Used

- React 19
- TypeScript
- Firebase Authentication
- React Router DOM
- CSS-in-JS (inline styles for simplicity)
