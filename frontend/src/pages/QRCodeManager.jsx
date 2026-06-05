import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import Pagination from '../components/Pagination'

const PER_PAGE = 8

export default function QRCodeManager() {
  const [students, setStudents] = useState([])
  const [sections, setSections] = useState([])
  const [sectionFilter, setSectionFilter] = useState('')
  const [search, setSearch] = useState('')
  const [qrData, setQrData] = useState({})
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(null)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState({ show: false, studentId: null, studentName: '' })
  const [preview, setPreview] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])
  const selectedIds = new Set(selectedStudents.map(s => s.id))
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)

  useEffect(() => { api.get('/sections').then(res => setSections(res.data)).catch(() => {}) }, [])

  useEffect(() => {
    setPage(1)
  }, [sectionFilter, search])

  const reqId = useRef(0)

  useEffect(() => {
    setLoading(true)
    const id = ++reqId.current
    const params = { per_page: PER_PAGE, page }
    if (sectionFilter) params.section = sectionFilter
    if (search) params.search = search
    api.get('/students', { params }).then(res => {
      if (id !== reqId.current) return
      setStudents(res.data.data)
      setTotalPages(res.data.last_page)
      setTotalStudents(res.data.total)
    }).catch(err => {
      if (id !== reqId.current) return
      setError(err.response?.data?.message || 'Failed to load students')
    }).finally(() => {
      if (id === reqId.current) setLoading(false)
    })
  }, [page, sectionFilter, search])

  useEffect(() => {
    api.get('/qr-codes/all').then(qrRes => {
      const map = {}
      qrRes.data.forEach(q => { map[q.student_id] = q })
      setQrData(map)
    }).catch(() => {})
  }, [])

  const toggleSelect = (id) => {
    setSelectedStudents(prev => {
      const exists = prev.find(s => s.id === id)
      if (exists) return prev.filter(s => s.id !== id)
      const student = students.find(s => s.id === id)
      return student ? [...prev, student] : prev
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents([...students])
    }
  }

  const someSelected = selectedStudents.length > 0

  const handleRegenerate = async (studentId, studentName) => {
    setConfirmModal({ show: true, studentId, studentName })
  }

  const [successMsg, setSuccessMsg] = useState('')

  const confirmRegenerate = async () => {
    const studentId = confirmModal.studentId
    const studentName = confirmModal.studentName
    setConfirmModal({ show: false, studentId: null, studentName: '' })
    setRegenerating(studentId)
    setError('')
    try {
      const res = await api.post(`/students/${studentId}/regenerate-qr`)
      const data = { ...res.data, svg_url: res.data.svg_url + '?t=' + Date.now() }
      setQrData({ ...qrData, [studentId]: data })
      setSuccessMsg(`QR code regenerated for ${studentName}`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Regeneration failed')
    }
    setRegenerating(null)
  }

  const doPrint = (list, title) => {
    if (list.length === 0) return
    let html = `
      <html><head><title>${title}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,sans-serif;padding:20px;background:#fff}
        h1{font-size:18px;margin-bottom:20px;color:#333}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .card{text-align:center;border:1px solid #e5e7eb;border-radius:12px;padding:20px;page-break-inside:avoid}
        .card img{width:180px;height:180px;margin:0 auto 12px;display:block}
        .card .name{font-weight:600;font-size:14px;color:#111}
        .card .id{font-size:12px;color:#6b7280;margin-top:2px}
        .card .section{font-size:12px;color:#6b7280;margin-top:2px}
        @media print{body{padding:10px}.grid{grid-template-columns:repeat(3,1fr);gap:15px}}
      </style>
      </head><body>
      <h1>${title}</h1>
      <div class="grid">
    `
    list.forEach(s => {
      const qr = qrData[s.id]
      if (qr?.svg_url) {
        html += `
          <div class="card">
            <img src="${qr.svg_url}" alt="QR"/>
            <div class="name">${s.first_name} ${s.last_name}</div>
            <div class="id">${s.student_id}</div>
            <div class="section">${s.section}</div>
          </div>
        `
      }
    })
    html += '</div></body></html>'
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:0'
    document.body.appendChild(iframe)
    iframe.contentWindow.document.write(html)
    iframe.contentWindow.document.close()
    setTimeout(() => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 500)
    }, 1500)
  }

  const printSelected = () => {
    const title = someSelected ? `QR Codes (${selectedIds.size} selected)` : 'Student QR Codes'
    if (someSelected) {
      doPrint(selectedStudents, title)
    } else {
      const params = { per_page: 9999 }
      if (sectionFilter) params.section = sectionFilter
      if (search) params.search = search
      api.get('/students', { params }).then(res => {
        doPrint(res.data.data || students, title)
      }).catch(() => {
        doPrint(students, title)
      })
    }
  }

  const downloadQR = async (qr) => {
    if (qr?.svg_url) {
      try {
        const res = await fetch(qr.svg_url)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qr-${qr.uuid}.svg`
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        // fallback: open in new tab
        window.open(qr.svg_url, '_blank')
      }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: PER_PAGE }, (_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5">
            <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
            <div className="h-32 w-32 bg-gray-200 rounded mx-auto mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 bg-gray-800 text-white px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-3 rounded-xl text-sm border border-gray-200">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={students.length > 0 && selectedIds.size === students.length}
              onChange={toggleSelectAll}
              className="accent-gray-900"
            />
            Select All
          </label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or ID..."
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 w-40"
          />
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="">All Sections</option>
            {sections.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        <button onClick={printSelected} className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          {someSelected ? `Print (${selectedStudents.length})` : 'Print All'}
        </button>
      </div>

      {students.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
          <p className="text-gray-400 text-sm">No students yet. Add students to generate QR codes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {students.map(student => {
            const qr = qrData[student.id]
            return (
              <div key={student.id} className={`card p-5 text-center hover:shadow-lg transition-all duration-200 group cursor-pointer ${selectedIds.has(student.id) ? 'ring-2 ring-gray-900' : ''}`} onClick={() => toggleSelect(student.id)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{student.section}</div>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(student.id)}
                    onChange={() => toggleSelect(student.id)}
                    className="accent-gray-900 pointer-events-none"
                  />
                </div>
                <div className="font-semibold text-gray-800 text-sm mb-0.5">{student.first_name} {student.last_name}</div>
                <div className="text-xs text-gray-400 font-mono mb-0.5">{student.student_id}</div>
                {qr?.qr_version !== undefined && (
                  <div className="text-xs text-gray-300 mb-4">v{qr.qr_version}</div>
                )}
                {qr?.svg_url ? (
                  <div className="relative mx-auto mb-4 w-36 h-36 p-2 bg-white rounded-xl border border-gray-100 group-hover:border-gray-300 transition-colors cursor-pointer" onClick={e => { e.stopPropagation(); setPreview({ url: qr.svg_url, name: `${student.first_name} ${student.last_name}`, id: student.student_id }) }}>
                    <img src={qr.svg_url} alt="QR Code" className="w-full h-full" />
                  </div>
                ) : (
                  <div className="w-36 h-36 mx-auto mb-4 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-dashed border-gray-200">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => downloadQR(qr)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Download QR Code">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Download
                  </button>
                  <button
                    onClick={() => handleRegenerate(student.id, `${student.first_name} ${student.last_name}`)}
                    disabled={regenerating === student.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    title="Regenerate QR Code"
                  >
                    <svg className={`w-3.5 h-3.5 ${regenerating === student.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    {regenerating === student.id ? '...' : 'Regen'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <img src={preview.url} alt="QR Code" className="w-56 h-56 mx-auto mb-4" />
              <p className="font-semibold text-gray-800 text-sm">{preview.name}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5 mb-4">{preview.id}</p>
              <button onClick={() => setPreview(null)} className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Regenerate QR Code?</h3>
              <p className="text-sm text-gray-500 mb-6">This will replace the existing QR code for <span className="font-medium text-gray-700">{confirmModal.studentName}</span>. This action cannot be undone.</p>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setConfirmModal({ show: false, studentId: null, studentName: '' })}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRegenerate}
                  className="px-4 py-2 text-sm rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
