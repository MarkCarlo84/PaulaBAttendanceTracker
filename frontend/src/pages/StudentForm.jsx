import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function StudentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [sections, setSections] = useState([])
  const [form, setForm] = useState({
    student_id: '', first_name: '', middle_name: '', last_name: '',
    section: '', gender: '',
  })
  const [error, setError] = useState('')

  useEffect(() => { api.get('/sections').then(res => setSections(res.data)).catch(() => {}) }, [])

  useEffect(() => {
    if (isEdit) {
      api.get(`/students/${id}`).then(res => {
        const s = res.data
        setForm({
          student_id: s.student_id, first_name: s.first_name,
          middle_name: s.middle_name || '', last_name: s.last_name,
          section: s.section, gender: s.gender || '',
        })
      }).catch(() => navigate('/students')).finally(() => setLoading(false))
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/students/${id}`, form)
      } else {
        await api.post('/students', form)
      }
      navigate('/students')
    } catch (err) {
      setError(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  if (loading) {
    return (
      <div className="animate-pulse max-w-2xl">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl"/>)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/students" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </Link>
        <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Student' : 'Add Student'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-3 rounded-xl text-sm border border-gray-200">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID <span className="text-gray-400">*</span></label>
            <input type="text" required value={form.student_id} onChange={handleChange('student_id')} className="input-field" placeholder="e.g. 20260001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade/Section <span className="text-gray-400">*</span></label>
            <select required value={form.section} onChange={handleChange('section')} className="input-field">
              <option value="">Select section...</option>
              {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select value={form.gender} onChange={handleChange('gender')} className="input-field">
              <option value="">Select gender...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-50 pt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-gray-400">*</span></label>
              <input type="text" required value={form.first_name} onChange={handleChange('first_name')} className="input-field" placeholder="Juan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Middle Name</label>
              <input type="text" value={form.middle_name} onChange={handleChange('middle_name')} className="input-field" placeholder="(optional)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-gray-400">*</span></label>
              <input type="text" required value={form.last_name} onChange={handleChange('last_name')} className="input-field" placeholder="Cruz" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> {isEdit ? 'Update Student' : 'Save Student'}</>
            )}
          </button>
          <Link to="/students" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
