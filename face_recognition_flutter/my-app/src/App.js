// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminDashboard from './pages/AdminDashboard'; 
import ClassManagement from './pages/ClassManagement';
import UserManagement from './pages/UserManagement';
import FaceRegistration from './pages/FaceRegistration';
import SubjectScheduleManagement from './pages/Subject_ScheduleManagement';
import AttendanceSessionManagement from './pages/AttendanceSessionManagement';
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import ClassDetail from './pages/teacher/ClassDetail';
import Login from './pages/Login';
import apiService from './services/api-service';
import authService from './services/auth-service';

window.apiService = apiService;   
window.authService = authService;

function App() {
  return (
    <BrowserRouter>
      {/* Có thể thêm Navbar ở đây */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/classes" element={<ClassManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/face-recognition" element={<FaceRegistration />} />
        <Route path="/subjects" element={<SubjectScheduleManagement />} />
        <Route path="/sessions" element={<AttendanceSessionManagement />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} /> 
        <Route path="/teacher/classes/:classId" element={<ClassDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
