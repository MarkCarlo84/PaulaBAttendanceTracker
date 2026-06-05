import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Pagination from '../components/Pagination'

export default function Sections() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [selectedSection, setSelectedSection] = useState(null)
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentPage, setStudentPage] = useState(1)
  const [studentTotal, setStudentTotal] = useState(0)
  const [studentLastPage, setStudentLastPage] = useState(1)

  const fetchSections = () => {
    setLoading(true)
    api.get('/sections').then(res => setSections(res.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchSections() }, [])

  const resetForm = () => { setForm({ name: '', description: '' }); setEditing(null); setShowForm(false) }

  const openEdit = (s) => { setForm({ name: s.name, description: s.description || '' }); setEditing(s.id); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/sections/${editing}`, form)
      } else {
        await api.post('/sections', form)
      }
      resetForm()
      fetchSections()
    } catch (err) {
      alert(err.response?.data?.errors?.name?.[0] || 'Save failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this section?')) return
    try { await api.delete(`/sections/${id}`); fetchSections() } catch {}
  }

  const viewStudents = async (section, page = 1) => {
    setSelectedSection(section)
    setStudentPage(page)
    setStudentsLoading(true)
    try {
      const res = await api.get('/students', { params: { section: section.name, per_page: 10, page } })
      setStudents(res.data.data || res.data)
      setStudentTotal(res.data.total || 0)
      setStudentLastPage(res.data.last_page || 1)
    } catch {}
    setStudentsLoading(false)
  }

  return (
    <div>
      {/* Students modal */}
      {selectedSection && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-12 px-4" onClick={() => setSelectedSection(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{selectedSection.name}</h3>
                <p className="text-xs text-gray-400">{students.length} student{students.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setSelectedSection(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {studentsLoading ? (
                <div className="space-y-2 p-2">{[1,2,3,4].map(i => <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-xl"/>)}</div>
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <p className="text-gray-400 text-sm">No students in this section</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {students.map(s => (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {s.first_name?.charAt(0)}{s.last_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/students/${s.id}/profile`} className="text-sm font-medium text-gray-800 truncate hover:text-gray-600 transition-colors block">{s.first_name} {s.last_name}</Link>
                          <div className="text-xs text-gray-400 font-mono">{s.student_id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {studentLastPage > 1 && (
                    <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">Page {studentPage} of {studentLastPage} ({studentTotal} total)</span>
                      </div>
                      <Pagination currentPage={studentPage} totalPages={studentLastPage} onPageChange={(p) => viewStudents(selectedSection, p)} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sections</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage class sections for student grouping</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Section
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card p-5 mb-6 max-w-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{editing ? 'Edit Section' : 'New Section'}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Name <span className="text-gray-400">*</span></label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Grade 10-A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder="Optional description" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary text-sm">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="animate-pulse h-16 bg-white rounded-2xl border border-gray-100"/>)}</div>
      ) : sections.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <p className="text-gray-400 text-sm">No sections yet. Create your first section.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {sections.map(s => (
            <div
              key={s.id}
              className="card p-4 flex items-center justify-between hover:shadow-md hover:border-gray-300 cursor-pointer transition-all"
              onClick={() => viewStudents(s)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{s.name}</div>
                  {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
