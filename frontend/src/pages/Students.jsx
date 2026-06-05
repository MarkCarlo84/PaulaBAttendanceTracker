import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Pagination from '../components/Pagination'

export default function Students() {
  const [students, setStudents] = useState([])
  const [sections, setSections] = useState([])
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [importStatus, setImportStatus] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)

  const fetchSections = () => { api.get('/sections').then(res => setSections(res.data)).catch(() => {}) }
  useEffect(() => { fetchSections() }, [])

  useEffect(() => { setPage(1) }, [search, sectionFilter, genderFilter])

  const fetchStudents = () => {
    setLoading(true)
    const params = { search, per_page: 10, page }
    if (sectionFilter) params.section = sectionFilter
    if (genderFilter) params.gender = genderFilter
    api.get('/students', { params })
      .then(res => {
        if (res.data.data) {
          setStudents(res.data.data)
          setTotalPages(res.data.last_page)
          setTotalStudents(res.data.total)
        } else {
          setStudents(res.data)
          setTotalPages(1)
          setTotalStudents(res.data.length || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStudents() }, [page, search, sectionFilter])

  const handleDelete = async (id) => {
    setDeleteTarget({ type: 'single', id })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.type === 'single') {
        await api.delete(`/students/${deleteTarget.id}`)
        setStudents(prev => prev.filter(s => s.id !== deleteTarget.id))
      } else {
        await api.post('/students/bulk-delete', { ids: [...selectedIds] })
        setSelectedIds(new Set())
        fetchStudents()
      }
    } catch {}
    setDeleting(false)
    setDeleteTarget(null)
  }

  const downloadTemplate = () => {
    const headers = ['student_id', 'first_name', 'middle_name', 'last_name', 'section', 'gender']
    const sample = ['20260001', 'Juan', 'Dela', 'Cruz', 'Grade 10-A', 'Male']
    const rows = [headers.join(','), sample.join(',')]
    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'student_import_template.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/students/export/csv', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'students_export.csv'
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {}
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportStatus(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImportStatus({ type: 'success', message: res.data.message || 'Import complete' })
      fetchStudents()
      fetchSections()
    } catch {
      setImportStatus({ type: 'error', message: 'Import failed. Check file format.' })
    }
    e.target.value = ''
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(students.map(s => s.id)))
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    setDeleteTarget({ type: 'bulk', count: selectedIds.size })
  }

  const SectionBadge = ({ section }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
      {section}
    </span>
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 w-full sm:w-auto items-center">
          <div className="relative flex-1 sm:flex-initial">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 w-full sm:w-52"
            />
          </div>
          <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="input-field w-auto text-sm">
            <option value="">All Sections</option>
            {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="input-field w-auto text-sm">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="btn-secondary text-sm flex items-center gap-2 whitespace-nowrap" title="Download CSV template">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Template
          </button>
          <button onClick={handleExportCsv} className="btn-secondary text-sm flex items-center gap-2 whitespace-nowrap" title="Export all students as CSV">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export CSV
          </button>
          <label className="btn-secondary cursor-pointer text-sm flex items-center gap-2 whitespace-nowrap">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            CSV Import
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <Link to="/students/new" className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Student
          </Link>
        </div>
      </div>

      {importStatus && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4 border ${
          importStatus.type === 'success' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
          <svg className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={importStatus.type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}/></svg>
          {importStatus.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-16 bg-white rounded-2xl border border-gray-100"/>)}
        </div>
      ) : (
        <div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-4 py-3.5 w-12">
                      <input
                        type="checkbox"
                        checked={students.length > 0 && selectedIds.size === students.length}
                        onChange={toggleSelectAll}
                        className="accent-gray-900 w-4 h-4"
                      />
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Student ID</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Section</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, i) => (
                    <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${i < students.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                          className="accent-gray-900 w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-sm font-mono text-gray-600">{student.student_id}</td>
                      <td className="px-4 py-3.5">
                          <Link to={`/students/${student.id}/profile`} className="flex items-center gap-3 hover:opacity-75 transition-opacity">
                          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{student.first_name} {student.last_name}</div>
                            {student.middle_name && <div className="text-xs text-gray-400">{student.middle_name}</div>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5"><SectionBadge section={student.section} /></td>
                      <td className="px-4 py-3.5">
                        {student.gender && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${student.gender === 'Male' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {student.gender}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/students/${student.id}/edit`} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </Link>
                          <button onClick={() => handleDelete(student.id)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-16 text-center">
                      <div className="text-gray-300 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      </div>
                      <p className="text-gray-400 text-sm">No students found</p>
                      <Link to="/students/new" className="text-gray-900 text-sm font-medium hover:text-gray-700 mt-1 inline-block">Add your first student</Link>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {selectedIds.size > 0 && (
              <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50 rounded-b-2xl">
                <span className="text-sm text-gray-700 font-medium">{selectedIds.size} student(s) selected</span>
                <button onClick={handleBulkDelete} className="btn-danger text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  Delete Selected
                </button>
              </div>
            )}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {deleteTarget.type === 'single'
                ? 'Delete this student? This action cannot be undone.'
                : `Delete ${deleteTarget.count} student(s)? This action cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Deleting...</>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
