import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchSettings = () => {
    setLoading(true)
    api.get('/settings').then(res => setSettings(res.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchSettings() }, [])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await api.post('/settings', settings)
      setMessage({ type: 'success', text: 'Settings saved successfully.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings.' })
    }
    setSaving(false)
  }

  const fields = [
    { key: 'school_name', label: 'School Name', type: 'text' },
    { key: 'term_label', label: 'Term/Label', type: 'text' },
    { key: 'auto_clear_days', label: 'Auto-clear attendance after N days', type: 'number' },
    { key: 'rollover_hour', label: 'Attendance rollover hour (24h format, e.g. 17 for 5PM)', type: 'number' },
  ]

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure app settings</p>
        </div>
        <div className="card p-6 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure app settings</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 max-w-lg space-y-4">
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type}
              value={settings[key] ?? ''}
              onChange={e => handleChange(key, e.target.value)}
              className="input-field"
            />
          </div>
        ))}

        {message && (
          <div className={`text-sm px-4 py-2.5 rounded-xl ${
            message.type === 'success'
              ? 'bg-gray-100 text-gray-700'
              : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
