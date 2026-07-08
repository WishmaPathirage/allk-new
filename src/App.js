import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Preloader from './components/preloader';
import Home from './pages/Home/Home';
import TeachersProfile from './pages/teacherprofiles/teacherprofiles';
// import ET from './pages/teacherprofiles/profiles/et';
import Geo from './pages/teacherprofiles/profiles/geo';
// import SFT from './pages/teacherprofiles/profiles/sft';
// import ICT from './pages/teacherprofiles/profiles/ict';
import Media from './pages/teacherprofiles/profiles/media';
import Political from './pages/teacherprofiles/profiles/political';
// import BS from './pages/teacherprofiles/profiles/bs';
import Econ from './pages/teacherprofiles/profiles/econ';
// import Accounting from './pages/teacherprofiles/profiles/accounting';
import Sinhala from './pages/teacherprofiles/profiles/sinhala';
import AdminDashboard from './pages/admin/AdminDashboard';
import MonthlyPayment from './pages/MonthlyPayment/MonthlyPayment';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentLogin from './pages/student/StudentLogin';
import StudentSignup from './pages/student/StudentSignup';
import StudentRegister from './pages/student/StudentRegister';
import SubjectPage from './pages/student/SubjectPage';
import TeacherLogin from './pages/teacher/TeacherLogin';
import TeacherDashboard from './pages/teacher/TeacherDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  const skipPreloader = sessionStorage.getItem('al_intro_done') === '1';
  const handlePreloaderDone = () => sessionStorage.setItem('al_intro_done', '1');

  return (
    <BrowserRouter>
      <ScrollToTop />
      {!skipPreloader && <Preloader onComplete={handlePreloaderDone} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacherprofiles" element={<TeachersProfile />} />
        {/* <Route path="/teacher/et" element={<ET />} /> */}
        <Route path="/teacher/geo" element={<Geo />} />
        {/* <Route path="/teacher/sft" element={<SFT />} /> */}
        {/* <Route path="/teacher/ict" element={<ICT />} /> */}
        <Route path="/teacher/media" element={<Media />} />
        <Route path="/teacher/political" element={<Political />} />
        {/* <Route path="/teacher/bs" element={<BS />} /> */}
        <Route path="/teacher/econ" element={<Econ />} />
        {/* <Route path="/teacher/accounting" element={<Accounting />} /> */}
        <Route path="/teacher/sinhala" element={<Sinhala />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/monthly-payment" element={<MonthlyPayment />} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/signup" element={<StudentSignup />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/subject/:teacherId" element={<SubjectPage />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
