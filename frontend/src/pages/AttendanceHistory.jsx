import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Pagination from '../components/Pagination'

export default function AttendanceHistory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState([])
  const [sectionFilter, setSectionFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    api.get('/sections').then(res => setSections(res.data)).catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [sectionFilter, genderFilter, statusFilter, search, dateFrom, dateTo])

  const fetchData = () => {
    setLoading(true)
    const params = { page, per_page: 20 }
    if (sectionFilter) params.section = sectionFilter
    if (genderFilter) params.gender = genderFilter
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    api.get('/attendance/report', { params })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [page, sectionFilter, genderFilter, statusFilter, search, dateFrom, dateTo])

  const attendances = data?.attendances?.data || []
  const pagination = data?.attendances || null

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Attendance History</h2>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <label className="block text-xs text-gray-400 mb-1">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="input-field text-sm py-1.5 pl-9 w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Section</label>
            <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="input-field text-sm py-1.5 px-3 w-44">
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gender</label>
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="input-field text-sm py-1.5 px-3 w-32">
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm py-1.5 px-3 w-32">
              <option value="">All</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm py-1.5 px-3 w-40" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm py-1.5 px-3 w-40" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      ) : attendances.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No attendance records found.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Student ID</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Section</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Time In</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">{a.attendance_date}</td>
                    <td className="py-2.5 px-3">
                      <Link to={`/students/${a.student?.id}/profile`} className="text-gray-900 font-medium hover:underline">
                        {a.student?.student_id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link to={`/students/${a.student?.id}/profile`} className="text-gray-700 hover:underline">
                        {a.student?.first_name} {a.student?.last_name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{a.student?.section}</td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{a.time_in ? a.time_in.substring(0, 5) : '--:--'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        a.status === 'PRESENT' ? 'bg-gray-800 text-white' : a.status === 'LATE' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {a.status === 'PRESENT' ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                            Present
                          </>
                        ) : a.status === 'LATE' ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Late
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                            Absent
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 max-w-[200px] truncate">{a.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <Pagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
