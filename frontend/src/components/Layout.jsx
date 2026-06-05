import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/students/new': 'Add Student',
  '/sections': 'Sections',
  '/qr-codes': 'QR Code Management',
  '/scanner': 'Attendance Scanner',
  '/attendance': 'Attendance Report',
}

export default function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Attendance Tracker'
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = () => setMobileOpen(v => !v)
  const closeSidebar = () => setMobileOpen(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={closeSidebar} />
      )}
      <Sidebar mobileOpen={mobileOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-3 flex items-center gap-4">
          <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-50" onClick={toggleSidebar}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
