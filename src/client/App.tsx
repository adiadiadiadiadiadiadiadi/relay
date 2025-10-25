import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Services from './pages/Services';
import PostJob from './pages/PostJob';
import EmployerDashboard from './pages/EmployerDashboard';
import JobDetails from './pages/JobDetails';
import AddWallet from './pages/AddWallet';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/services" element={<Services />} />
              <Route path="/post-job" element={<PostJob />} />
              <Route path="/job/:jobId" element={<JobDetails />} />
              <Route path="/employer/:userId" element={<EmployerDashboard />} />
              <Route path="/add-wallet" element={<AddWallet />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/home" element={<Home />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
