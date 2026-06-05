import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentForm from './pages/StudentForm'
import QRCodeManager from './pages/QRCodeManager'
import Scanner from './pages/Scanner'
import AttendanceReport from './pages/AttendanceReport'
import Sections from './pages/Sections'
import Settings from './pages/Settings'
import StudentProfile from './pages/StudentProfile'

export default function App() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/new" element={<StudentForm />} />
          <Route path="/students/:id/edit" element={<StudentForm />} />
          <Route path="/sections" element={<Sections />} />
          <Route path="/qr-codes" element={<QRCodeManager />} />
          <Route path="/attendance" element={<AttendanceReport />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/students/:id/profile" element={<StudentProfile />} />
        </Route>
        <Route path="/scanner" element={<Scanner />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
