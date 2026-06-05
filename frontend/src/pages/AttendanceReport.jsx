import { useState, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Pagination from '../components/Pagination'

export default function AttendanceReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('present')
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [students, setStudents] = useState([])
  const [sections, setSections] = useState([])
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [markStudentId, setMarkStudentId] = useState('')
  const [markStatus, setMarkStatus] = useState('PRESENT')
  const [markRemarks, setMarkRemarks] = useState('')
  const [marking, setMarking] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [sectionFilter, setSectionFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [isRangeMode, setIsRangeMode] = useState(false)
  const [page, setPage] = useState(1)

  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkSection, setBulkSection] = useState('')
  const [bulkStatus, setBulkStatus] = useState('PRESENT')
  const [bulkRemarks, setBulkRemarks] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchData = () => {
    setLoading(true)
    if (isRangeMode) {
      const params = { date_from: dateFrom, date_to: dateTo }
      if (sectionFilter) params.section = sectionFilter
      if (genderFilter) params.gender = genderFilter
      if (search) params.search = search
      api.get('/attendance/report', { params })
        .then(res => setData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      const params = { page, per_page: 10 }
      if (sectionFilter) params.section = sectionFilter
      if (genderFilter) params.gender = genderFilter
      api.get('/attendance/today', { params })
        .then(res => setData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => { fetchData() }, [isRangeMode, page])
  useEffect(() => { if (isRangeMode) fetchData() }, [dateFrom, dateTo, sectionFilter, genderFilter])
  useEffect(() => { if (!isRangeMode) { setPage(1); fetchData() } }, [sectionFilter, genderFilter])

  useEffect(() => {
    api.get('/sections').then(res => setSections(res.data)).catch(() => {})
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students', { params: { per_page: 9999 } })
      setStudents(res.data.data || res.data)
    } catch { setStudents([]) }
  }

  const handleExportCsv = async () => {
    setExporting(true)
    setFeedback({ type: '', message: '' })
    try {
      const params = isRangeMode ? { date_from: dateFrom, date_to: dateTo } : {}
      if (sectionFilter) params.section = sectionFilter
      if (genderFilter) params.gender = genderFilter
      const res = await api.get('/attendance/export/xlsx', { params, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = sectionFilter ? `Attendance Record - ${sectionFilter}.xlsx` : 'Attendance Record.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      setFeedback({ type: 'error', message: 'Failed to export CSV' })
    }
    setExporting(false)
  }

  const openMarkModal = () => {
    setFeedback({ type: '', message: '' })
    setMarkStudentId('')
    setMarkStatus('PRESENT')
    setMarkRemarks('')
    fetchStudents()
    setShowMarkModal(true)
  }

  const openBulkModal = () => {
    setBulkSection('')
    setBulkStatus('PRESENT')
    setBulkRemarks('')
    setShowBulkModal(true)
  }

  const handleMarkAttendance = async () => {
    if (!markStudentId) return
    setMarking(true)
    setFeedback({ type: '', message: '' })
    try {
      await api.post('/attendance/mark', { student_id: markStudentId, status: markStatus, remarks: markRemarks || undefined })
      setFeedback({ type: 'success', message: 'Attendance recorded successfully' })
      setShowMarkModal(false)
      fetchData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to record attendance' })
    }
    setMarking(false)
  }

  const handleBulkMark = async () => {
    if (!bulkSection) return
    setBulkLoading(true)
    try {
      await api.post('/attendance/bulk-mark', { section: bulkSection, status: bulkStatus, remarks: bulkRemarks || undefined })
      setFeedback({ type: 'success', message: `Marked all "${bulkSection}" students as ${bulkStatus}` })
      setShowBulkModal(false)
      fetchData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to bulk mark' })
    }
    setBulkLoading(false)
  }

  let presentCount = 0, absentCount = 0, lateCount = 0, totalCount = 0
  let pagination = null
  let todaySections = []

  if (isRangeMode && data) {
    presentCount = data.summary?.present || 0
    absentCount = data.summary?.absent || 0
    lateCount = data.summary?.late || 0
    totalCount = data.summary?.total_records || 0
  } else if (data) {
    const totals = data.totals || {}
    presentCount = totals.present || 0
    absentCount = totals.absent || 0
    lateCount = totals.late || 0
    totalCount = totals.total || 0
    pagination = data.pagination || null
    todaySections = data.sections || []
  }

  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  const STATUS_MAP = { present: 'PRESENT', absent: 'ABSENT', late: 'LATE' }

  let displayStudents = []
  if (data?.attendances) {
    const raw = data.attendances
    const atts = Array.isArray(raw) ? raw : (raw?.data || [])
    const filtered = isRangeMode || filter === 'all'
      ? atts
      : atts.filter(s => s.status === STATUS_MAP[filter])
    displayStudents = filtered.map(a => ({
      ...a,
      _displayName: a.student?.first_name + ' ' + a.student?.last_name,
      _displayId: a.student?.student_id,
      _displaySection: a.student?.section,
      _status: a.status,
      _time_in: a.time_in,
    }))
  }

  const searched = displayStudents.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = s._displayName || s.student?.first_name + ' ' + s.student?.last_name || ''
    const id = s._displayId || s.student?.student_id || ''
    return name.toLowerCase().includes(q) || id.toLowerCase().includes(q)
  })

  const groupBySection = (list) => {
    const groups = {}
    list.forEach(s => {
      const sec = s._displaySection || s.student?.section || s.section || 'Unassigned'
      if (!groups[sec]) groups[sec] = []
      groups[sec].push(s)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }

  const sectionGroups = !isRangeMode ? groupBySection(searched) : []

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-24 bg-white rounded-2xl border border-gray-100"/>)}
        </div>
        <div className="animate-pulse h-64 bg-white rounded-2xl border border-gray-100"/>
      </div>
    )
  }

  const filters = !isRangeMode ? [
    { key: 'present', label: 'Present', count: presentCount },
    { key: 'absent', label: 'Absent', count: absentCount },
    ...(lateCount > 0 ? [{ key: 'late', label: 'Late', count: lateCount }] : []),
  ] : []

  return (
    <div>
      {feedback.message && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
          feedback.type === 'success' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {feedback.type === 'success'
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            }
          </svg>
          {feedback.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isRangeMode ? 'Attendance Report' : "Today's Attendance"}
          </h2>
          {!isRangeMode && data?.school_day && (
            <p className="text-xs text-gray-400 mt-0.5">
              School Day: {data.school_day}
              {data.rollover_hour ? ` (rollover at ${data.rollover_hour}:00)` : ''}
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <div className={`w-10 h-5 rounded-full transition-colors ${isRangeMode ? 'bg-gray-900' : 'bg-gray-200'}`}
            onClick={() => setIsRangeMode(!isRangeMode)}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${isRangeMode ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
          </div>
          Date Range
        </label>
      </div>

      {isRangeMode && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm py-1.5 px-3 w-40" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm py-1.5 px-3 w-40" />
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
          <div className="self-end">
            <button onClick={fetchData} className="btn-primary text-sm py-1.5 px-4">Search</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="card p-4 border-l-4 border-l-gray-900">
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">{isRangeMode ? 'Total Records' : 'Total Students'}</div>
        </div>
        <div className="card p-4 border-l-4 border-l-gray-500">
          <div className="text-2xl font-bold text-gray-800">{presentCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Present</div>
        </div>
        <div className="card p-4 border-l-4 border-l-gray-400">
          <div className="text-2xl font-bold text-gray-600">{lateCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Late</div>
        </div>
        <div className="card p-4 border-l-4 border-l-gray-200">
          <div className="text-2xl font-bold text-gray-400">{absentCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Absent</div>
        </div>
        <div className="card p-4 border-l-4 border-l-gray-900">
          <div className="text-2xl font-bold text-gray-900">{rate}%</div>
          <div className="text-xs text-gray-500 mt-0.5">Attendance Rate</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {!isRangeMode && (
            <>
              <select value={sectionFilter} onChange={e => { setSectionFilter(e.target.value); setPage(1) }} className="input-field text-sm py-1.5 px-3 w-44">
                <option value="">All Sections</option>
                {todaySections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
              <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1) }} className="input-field text-sm py-1.5 px-3 w-32">
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </>
          )}
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                filter === f.key ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}>
              {f.label} <span className={`ml-1.5 text-xs ${filter === f.key ? 'text-gray-300' : 'text-gray-400'}`}>({f.count})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Search name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 w-full sm:w-48 text-sm" />
          </div>
          <button onClick={openMarkModal} className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1.5 whitespace-nowrap">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Mark
          </button>
          {!isRangeMode && (
            <button onClick={openBulkModal} className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              Bulk
            </button>
          )}
          <button onClick={handleExportCsv} disabled={exporting}
            className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap">
            <svg className={`w-4 h-4 shrink-0 ${exporting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {lateCount > 0 && (
        <div className="text-xs text-gray-400 mb-3">Late: {lateCount}</div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Student ID</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Section</th>
                {isRangeMode && <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>}
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time In</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {!isRangeMode ? (
                sectionGroups.map(([sec, students], gi) => (
                  <Fragment key={sec}>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <td colSpan={isRangeMode ? 7 : 6} className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {sec} <span className="font-normal text-gray-400">({students.length})</span>
                      </td>
                    </tr>
                    {students.map((s, i) => {
                      const name = s._displayName || ''
                      const studentId = s._displayId || ''
                      const section = s._displaySection || ''
                      const studentPk = s.student?.id || s.id || ''
                      const st = s.status || 'PRESENT'
                      const remarks = s.remarks || ''
                      return (
                        <tr key={`${sec}-${s.id || i}`} className={`hover:bg-gray-50 transition-colors ${st === 'ABSENT' ? 'opacity-80' : ''}`}>
                          <td className="px-4 py-3.5 text-sm font-mono text-gray-600">{studentId}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {(() => { const parts = name.split(' '); return parts.length > 1 ? parts[0].charAt(0) + parts[parts.length-1].charAt(0) : name?.charAt(0) || '?' })()}
                              </div>
                              <Link to={`/students/${studentPk}/profile`} className="text-sm font-medium text-gray-800 hover:text-gray-600 transition-colors">{name}</Link>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500">{section}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-600 font-mono">{s.time_in}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              st === 'PRESENT' ? 'bg-gray-800 text-white' : st === 'LATE' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {st === 'PRESENT' ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                              )}
                              {st}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-400 max-w-[200px] truncate">{remarks || '-'}</td>
                        </tr>
                      )
                    })}
                  </Fragment>
                ))
              ) : (
                searched.map((s, i) => {
                  const name = s._displayName || (s.student?.first_name + ' ' + s.student?.last_name) || ''
                  const studentId = s._displayId || s.student?.student_id || ''
                  const section = s._displaySection || s.student?.section || ''
                  const studentPk = s.student?.id || s.id || ''
                  const st = s.status || s._status || 'PRESENT'
                  const remarks = s.remarks || ''
                  return (
                    <tr key={s.id || i} className={`hover:bg-gray-50 transition-colors ${i < searched.length - 1 ? 'border-b border-gray-50' : ''} ${st === 'ABSENT' ? 'opacity-80' : ''}`}>
                      <td className="px-4 py-3.5 text-sm font-mono text-gray-600">{studentId}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(() => { const parts = name.split(' '); return parts.length > 1 ? parts[0].charAt(0) + parts[parts.length-1].charAt(0) : name?.charAt(0) || '?' })()}
                          </div>
                          <Link to={`/students/${studentPk}/profile`} className="text-sm font-medium text-gray-800 hover:text-gray-600 transition-colors">{name}</Link>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{section}</td>
                      {isRangeMode && <td className="px-4 py-3.5 text-sm text-gray-500">{s.attendance_date}</td>}
                      <td className="px-4 py-3.5 text-sm text-gray-600 font-mono">{s.time_in || s._time_in}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          st === 'PRESENT' ? 'bg-gray-800 text-white' : st === 'LATE' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {st === 'PRESENT' ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                          )}
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-400 max-w-[200px] truncate">{remarks || '-'}</td>
                    </tr>
                  )
                })
              )}
              {!isRangeMode && sectionGroups.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <p className="text-gray-400 text-sm">No records match your filter</p>
                </td></tr>
              )}
              {isRangeMode && searched.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <p className="text-gray-400 text-sm">No records match your filter</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={pagination?.last_page || 1} onPageChange={setPage} />

      {/* Manual Mark Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => { setShowMarkModal(false); setFeedback({ type: '', message: '' }) }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Mark Attendance</h3>
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Student</label>
                  <select value={markStudentId} onChange={e => setMarkStudentId(e.target.value)}
                    className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400">
                    <option value="">Select a student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {['PRESENT', 'ABSENT', 'LATE'].map(st => (
                      <label key={st}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                          markStatus === st ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                        }`}>
                        <input type="radio" name="status" value={st} checked={markStatus === st} onChange={e => setMarkStatus(e.target.value)} className="sr-only" />
                        {st === 'PRESENT' ? 'Present' : st === 'ABSENT' ? 'Absent' : 'Late'}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Remarks (optional)</label>
                  <input type="text" value={markRemarks} onChange={e => setMarkRemarks(e.target.value)} placeholder="e.g. Field trip, sick" className="input-field text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center mt-6">
                <button onClick={() => { setShowMarkModal(false); setFeedback({ type: '', message: '' }) }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleMarkAttendance} disabled={marking || !markStudentId}
                  className="px-4 py-2 text-sm rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {marking ? 'Recording...' : 'Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Mark Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Bulk Mark Attendance</h3>
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Section</label>
                  <select value={bulkSection} onChange={e => setBulkSection(e.target.value)}
                    className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400">
                    <option value="">Select a section...</option>
                    {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {['PRESENT', 'ABSENT', 'LATE'].map(st => (
                      <label key={st}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                          bulkStatus === st ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                        }`}>
                        <input type="radio" name="bulkStatus" value={st} checked={bulkStatus === st} onChange={e => setBulkStatus(e.target.value)} className="sr-only" />
                        {st === 'PRESENT' ? 'Present' : st === 'ABSENT' ? 'Absent' : 'Late'}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Remarks (optional)</label>
                  <input type="text" value={bulkRemarks} onChange={e => setBulkRemarks(e.target.value)} placeholder="e.g. Field trip, holiday" className="input-field text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center mt-6">
                <button onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleBulkMark} disabled={bulkLoading || !bulkSection}
                  className="px-4 py-2 text-sm rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {bulkLoading ? 'Marking...' : 'Mark All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
