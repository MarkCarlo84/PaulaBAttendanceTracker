import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/students/${id}/attendance`),
    ])
      .then(([studentRes, attendanceRes]) => {
        setStudent(studentRes.data)
        setRecords(attendanceRes.data)
      })
      .catch(() => navigate('/students'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-10 w-24 bg-gray-200 rounded-lg" />
        <div className="animate-pulse h-32 bg-white rounded-2xl border border-gray-100" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-24 bg-white rounded-2xl border border-gray-100" />
          ))}
        </div>
        <div className="animate-pulse h-64 bg-white rounded-2xl border border-gray-100" />
      </div>
    )
  }

  if (!student) return null

  const totalDays = records.length
  const presentCount = records.filter(r => r.status === 'PRESENT').length
  const absentCount = records.filter(r => r.status === 'ABSENT').length
  const rate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0

  const initials = student.first_name?.charAt(0) + student.last_name?.charAt(0) || '??'

  return (
    <div>
      <button onClick={() => navigate('/students')} className="btn-secondary text-sm flex items-center gap-2 mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Back to Students
      </button>

      <div className="card p-6 flex items-center gap-5 mb-6">
        <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{student.first_name} {student.last_name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="font-mono">{student.student_id}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>{student.section}</span>
            {student.gender && <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span>{student.gender}</span></>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">{totalDays}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Days</div>
        </div>
        <div className="card p-4 border-l-4 border-l-gray-900">
          <div className="text-2xl font-bold text-gray-800">{presentCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Present</div>
        </div>
        <div className="card p-4 border-l-4 border-l-gray-400">
          <div className="text-2xl font-bold text-gray-600">{absentCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Absent</div>
        </div>
        <div className="card p-4 border-l-4 border-l-gray-900">
          <div className="text-2xl font-bold text-gray-900">{rate}%</div>
          <div className="text-xs text-gray-500 mt-0.5">Attendance Rate</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time In</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id || i} className={`hover:bg-gray-50 transition-colors ${i < records.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{r.attendance_date}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{r.time_in}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      r.status === 'PRESENT' ? 'bg-gray-800 text-white' : r.status === 'LATE' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {r.status === 'PRESENT' ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                      )}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-400 max-w-[200px] truncate">{r.remarks || '-'}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <p className="text-gray-400 text-sm">No attendance records yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
