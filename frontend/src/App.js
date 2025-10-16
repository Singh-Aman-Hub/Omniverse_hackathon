import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import Landing from '@/components/Landing';
import Dashboard from '@/components/Dashboard';
import PrescriptionUpload from '@/components/PrescriptionUpload';
import MedicineStock from '@/components/MedicineStock';
import ChatAssistant from '@/components/ChatAssistant';
import Alerts from '@/components/Alerts';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set axios defaults
axios.defaults.baseURL = API;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token is valid
      axios.get('/dashboard/stats')
        .then(() => setLoading(false))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-2xl font-semibold text-emerald-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={!token ? <Landing onLogin={handleLogin} /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={token ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/upload"
            element={token ? <PrescriptionUpload onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/medicines"
            element={token ? <MedicineStock onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/chat"
            element={token ? <ChatAssistant onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/alerts"
            element={token ? <Alerts onLogout={handleLogout} /> : <Navigate to="/" />}
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" expand={true} richColors />
    </>
  );
}

export default App;