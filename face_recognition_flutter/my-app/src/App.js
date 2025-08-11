// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminDashboard from './pages/AdminDashboard'; 
import ClassManagement from './pages/ClassManagement';
import Login from './pages/Login';
import apiService from './services/api-service';
import authService from './services/auth-service';

window.apiService = apiService;   // <-- This is missing
window.authService = authService;

function App() {
  return (
    <BrowserRouter>
      {/* Có thể thêm Navbar ở đây */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/classes" element={<ClassManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
