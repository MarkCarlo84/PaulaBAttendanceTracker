import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const [scanMode, setScanMode] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [toast, setToast] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [scannerError, setScannerError] = useState('')
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
    setScannerError('')
    setToast(null)
    setShowManual(false)
    setStarting(true)
    setScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode("login-scanner-fullscreen")
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
      setScannerError('Camera access denied or not available')
    }
  }, [onScanSuccess])

  const openScanner = () => {
    setScanMode(true)
    setScannerError('')
    setToast(null)
    setShowManual(false)
    setManualId('')
  }

  const closeScanner = () => {
    stopScanner()
    setScanMode(false)
  }

  const openManual = () => {
    stopScanner()
    setScannerError('')
    setToast(null)
    setShowManual(true)
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!manualId.trim()) return
    setManualLoading(true)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
    } catch (err) {
      setError(err.response?.data?.errors?.email?.[0] || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #000 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        </div>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-200 dark:bg-gray-700 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-200 dark:bg-gray-700 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl shadow-lg shadow-gray-900/10 mb-4 ring-4 ring-gray-100 dark:ring-gray-800">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Attendance Tracker</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Sign in to manage student attendance</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl shadow-gray-200/60 dark:shadow-gray-950/50 border border-gray-100 dark:border-gray-700/50 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl text-sm border border-gray-200 dark:border-gray-600/50 animate-[fadeIn_0.2s_ease]">
                <svg className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field pl-10" placeholder="Enter your email" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field pl-10 pr-10" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700/50" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-3 text-gray-400 dark:text-gray-500 font-medium tracking-wider">or</span></div>
            </div>

            <button type="button" onClick={openScanner} className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-medium border border-gray-200 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500 active:scale-[0.98] transition-all duration-150 text-sm group">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Scan QR Code
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">Attendance Tracker v1.0</p>
        </div>
      </div>

      {/* Fullscreen Scanner Overlay */}
      {scanMode && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/60 text-white">
            <button onClick={closeScanner} className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back
            </button>
            <span className="text-sm font-medium text-white/80">QR Attendance Scanner</span>
            <div className="w-16" />
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            {!scanning && !showManual && !scannerError && (
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

            <div id="login-scanner-fullscreen" className={`w-full max-w-lg mx-auto ${scanning ? '' : 'hidden'}`} />

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
                      <button type="submit" disabled={manualLoading || !manualId.trim()} className="flex-1 px-4 py-3 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
                        {manualLoading ? (
                          <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Submitting...</>
                        ) : 'Record Attendance'}
                      </button>
                      <button type="button" onClick={() => { setShowManual(false); startScanner() }} className="px-4 py-3 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition-all">
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

            {scannerError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                  </div>
                  <p className="text-white text-sm mb-4">{scannerError}</p>
                  <button onClick={startScanner} className="px-6 py-2.5 bg-white text-gray-900 rounded-xl font-medium text-sm hover:bg-white/90 transition-all">
                    Try Again
                  </button>
                  <button onClick={closeScanner} className="px-6 py-2.5 text-white/70 text-sm ml-2 hover:text-white transition-all">
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {scanning && !starting && (
            <div className="relative z-10 flex items-center justify-center gap-2 px-4 py-3 bg-black/40 text-white/60 text-xs">
              <span className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
              Scanning — hold QR code steady inside the frame
              <button onClick={openManual} className="ml-2 text-white/50 hover:text-white/90 underline underline-offset-2 transition-colors">
                Type ID instead
              </button>
              <button onClick={closeScanner} className="ml-auto text-white/50 hover:text-white/90 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )}

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
      )}
    </>
  )
}
