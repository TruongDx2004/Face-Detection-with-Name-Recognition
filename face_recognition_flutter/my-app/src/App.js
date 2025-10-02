// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminDashboard from './pages/AdminDashboard';
import ClassManagement from './pages/ClassManagement';
import CourseManagement from './pages/CourseManagement';
import UserManagement from './pages/UserManagement';
import FaceRegistration from './pages/FaceRegistration';
import SubjectScheduleManagement from './pages/SubjectManagement';
import AttendanceSessionManagement from './pages/AttendanceSessionManagement';
import ScheduleManagement from './pages/ScheduleManagement';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ClassDetail from './pages/teacher/ClassDetail';
import TeacherSchedules from './pages/teacher/TeacherSchedules';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import AssignmentForm from './pages/teacher/AssignmentForm';
import AssignmentDetail from './pages/teacher/AssignmentDetail';
import TeacherExams from './pages/teacher/TeacherExams';
import CourseSectionDetail from './pages/teacher/CourseSectionDetail';
import TeacherCourseSections from './pages/teacher/TeacherCourseSections';
import GradeConfiguration from './pages/teacher/GradeConfiguration';
import ExamForm from './pages/teacher/ExamForm';
import ExamResults from './pages/teacher/ExamResults';
import AssignmentTemplateBank from './pages/teacher/AssignmentTemplateBank';
import AssignmentTemplateBankForm from './pages/teacher/AssignmentTemplateForm';

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
        <Route path="/course-sections" element={<CourseManagement />} />
        <Route path="/schedules" element={<ScheduleManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/face-recognition" element={<FaceRegistration />} />
        <Route path="/subjects" element={<SubjectScheduleManagement />} />
        <Route path="/sessions" element={<AttendanceSessionManagement />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<ClassDetail />} />
        <Route path="/teacher/classes/:classId" element={<ClassDetail />} />
        <Route path="/teacher/course-sections" element={<TeacherCourseSections />} />
        <Route path="/teacher/schedules" element={<TeacherSchedules />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        <Route path="/teacher/assignments" element={<TeacherAssignments />} />
        <Route path="/teacher/assignments/new" element={<AssignmentForm />} />
        <Route path="/teacher/assignments/:id" element={<AssignmentDetail />} />
        <Route path="/teacher/assignments/:id/edit" element={<AssignmentForm />} />
        <Route path="/teacher/course-sections/:courseSectionId" element={<CourseSectionDetail />} />
        <Route path="/teacher/course-sections/:courseSectionId/grade-config" element={<GradeConfiguration />} />
        <Route path="/teacher/exams" element={<TeacherExams />} />
        <Route path="/teacher/exams/create" element={<ExamForm />} />
        <Route path="/teacher/exams/edit/:id" element={<ExamForm />} />
        <Route path="/teacher/exams/:examId/results" element={<ExamResults />} />
        <Route path="/teacher/assignment-templates" element={<AssignmentTemplateBank />} />
        <Route path="/teacher/assignment-templates/:id" element={<AssignmentTemplateBankForm />} />
        <Route path="/teacher/assignment-templates/new" element={<AssignmentTemplateBankForm />} />
        <Route path="/teacher/assignment-templates/:id/edit" element={<AssignmentTemplateBankForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
