import { useState, useRef, useEffect, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Scanner() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [toast, setToast] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [manualId, setManualId] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const toastTimer = useRef(null)
  const isRunningRef = useRef(false)
  const html5QrCodeRef = useRef(null)
  const manualInputRef = useRef(null)

  const showToast = useCallback((type, message, student) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, message, student })
    toastTimer.current = setTimeout(() => {
      setToast(null)
      toastTimer.current = null
    }, type === 'already' ? 1500 : 2000)
  }, [])

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 1200
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }, [])

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current && isRunningRef.current) {
      try { html5QrCodeRef.current.stop() } catch {}
      isRunningRef.current = false
    }
    html5QrCodeRef.current = null
    setScanning(false)
    setStarting(false)
  }, [])

  useEffect(() => {
    return () => {
      stopScanner()
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [stopScanner])

  useEffect(() => {
    if (showManual && manualInputRef.current) manualInputRef.current.focus()
  }, [showManual])

  const onScanSuccess = useCallback(async (decodedText) => {
    playBeep()
    const qr = html5QrCodeRef.current
    if (!qr) return
    try { qr.pause() } catch {}
    try {
      const res = await api.post('/attendance/scan', { qr_data: decodedText })
      const isAlready = res.data.message === 'Attendance already recorded today.'
      showToast(
        isAlready ? 'already' : 'success',
        isAlready ? 'Already recorded today' : 'Attendance Recorded!',
        res.data.student
      )
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to record attendance', null)
    }
    setTimeout(() => {
      if (html5QrCodeRef.current) {
        try { html5QrCodeRef.current.resume() } catch {}
      }
    }, 500)
  }, [showToast])

  const startScanner = useCallback(async () => {
    setError('')
    setToast(null)
    setShowManual(false)
    setStarting(true)
    setScanning(true)
    try {
      const html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCodeRef.current = html5QrCode
      const config = { fps: 15, qrbox: { width: 280, height: 280 } }
      try {
        await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, () => {})
      } catch {
        await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, () => {})
      }
      isRunningRef.current = true
      setStarting(false)
    } catch (err) {
      setScanning(false)
      setStarting(false)
      setError('Camera access denied or not available')
    }
  }, [onScanSuccess])

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!manualId.trim()) return
    setManualLoading(true)
    setError('')
    try {
      const res = await api.post('/attendance/scan', { student_id: manualId.trim() })
      playBeep()
      const isAlready = res.data.message === 'Attendance already recorded today.'
      showToast(
        isAlready ? 'already' : 'success',
        isAlready ? 'Already recorded today' : 'Attendance Recorded!',
        res.data.student
      )
      setManualId('')
      if (manualInputRef.current) manualInputRef.current.focus()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Student not found', null)
    }
    setManualLoading(false)
  }

  const openManual = () => {
    stopScanner()
    setError('')
    setToast(null)
    setShowManual(true)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/60 text-white">
        <button
          onClick={() => { stopScanner(); navigate('/') }}
          className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back
        </button>
        <span className="text-sm font-medium text-white/80">QR Attendance Scanner</span>
        <div className="w-16" />
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex items-center justify-center relative">
        {!scanning && !showManual && !error && (
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Ready to Scan</h2>
            <p className="text-sm text-white/60 mb-8">Position a QR code inside the frame</p>
            <button onClick={startScanner} className="px-8 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg">
              Start Scanner
            </button>
            <div className="mt-4">
              <button onClick={openManual} className="text-sm text-white/50 hover:text-white/80 transition-colors underline underline-offset-2">
                Or enter student ID manually
              </button>
            </div>
          </div>
        )}

        <div id="qr-reader" className={`w-full max-w-lg mx-auto ${scanning ? '' : 'hidden'}`}></div>

        {showManual && (
          <div className="w-full max-w-sm mx-auto px-4">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a3 3 0 006 0m-3-3a3 3 0 013 3"/></svg>
                </div>
                <h2 className="text-lg font-semibold text-white">Enter Student ID</h2>
                <p className="text-sm text-white/50 mt-1">Type the student ID number manually</p>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  placeholder="e.g. 20260001"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  disabled={manualLoading}
                  autoComplete="off"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={manualLoading || !manualId.trim()}
                    className="flex-1 px-4 py-3 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {manualLoading ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Submitting...</>
                    ) : (
                      'Record Attendance'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManual(false)}
                    className="px-4 py-3 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition-all"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {starting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center text-white">
              <svg className="animate-spin h-8 w-8 mx-auto mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <p className="text-sm text-white/80">Opening camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              </div>
              <p className="text-white text-sm mb-4">{error}</p>
              <button onClick={startScanner} className="px-6 py-2.5 bg-white text-gray-900 rounded-xl font-medium text-sm hover:bg-white/90 transition-all">
                Try Again
              </button>
              <button onClick={() => navigate('/')} className="px-6 py-2.5 text-white/70 text-sm ml-2 hover:text-white transition-all">
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scanning indicator */}
      {scanning && !starting && (
        <div className="relative z-10 flex items-center justify-center gap-2 px-4 py-3 bg-black/40 text-white/60 text-xs">
          <span className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
          Scanning — hold QR code steady inside the frame
          <button onClick={openManual} className="ml-2 text-white/50 hover:text-white/90 underline underline-offset-2 transition-colors">
            Type ID instead
          </button>
          <button onClick={stopScanner} className="ml-auto text-white/50 hover:text-white/90 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4 pointer-events-none">
          <div className="rounded-2xl p-4 shadow-2xl backdrop-blur-md bg-gray-900/95 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-700">
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                ) : toast.type === 'already' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{toast.message}</p>
                {toast.student && (
                  <p className="text-xs text-white/80 truncate">{toast.student.name} ({toast.student.student_id})</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
