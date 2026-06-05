import { useState, useEffect } from 'react'
import api from '../services/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])
  const [students, setStudents] = useState([])
  const [sections, setSections] = useState([])
  const [sectionFilter, setSectionFilter] = useState('')

  const fetchStats = () => {
    const params = sectionFilter ? { section: sectionFilter } : {}
    api.get('/dashboard', { params }).then(res => setStats(res.data)).catch(() => {})
    api.get('/dashboard/trend', { params }).then(res => setTrend(res.data.trend || [])).catch(() => {})
  }

  useEffect(() => {
    fetchStats()
  }, [sectionFilter])

  useEffect(() => {
    api.get('/sections').then(res => setSections(res.data)).catch(() => {})
    api.get('/students', { params: { per_page: 1000 } }).then(res => {
      setStudents(res.data.data || res.data)
    }).catch(() => {})
  }, [])

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-6">
            <div className="h-3 w-3 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Students', value: stats.total_students,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    },
    {
      label: 'Present Today', value: stats.present_today,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    },
    {
      label: 'Absent Today', value: stats.absent_today,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    },
    {
      label: 'Attendance Rate', value: `${stats.attendance_rate}%`,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    },
  ]

  const pieData = [
    { name: 'Present', value: stats.present_today },
    { name: 'Absent', value: stats.absent_today },
  ]
  const COLORS = ['#111827', '#D1D5DB']

  const sectionCounts = {}
  students.forEach(s => {
    const sec = s.section || 'Unassigned'
    sectionCounts[sec] = (sectionCounts[sec] || 0) + 1
  })
  const barData = sections.map(s => ({
    name: s.name,
    count: sectionCounts[s.name] || 0,
  }))

  const trendData = trend.map(t => ({
    ...t,
    date: t.date ? t.date.slice(5) : '',
  }))

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400">
              <option value="">Overall</option>
              {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_students}</div>
          <div className="text-sm text-gray-500 mt-0.5">Total Students</div>
        </div>
        {cards.slice(1).map(card => (
          <div key={card.label} className="card p-5">
            <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center mb-4">
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {stats.present_today > 0 && (
        <div className="card p-5 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Today's Progress</h3>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="bg-gray-900 h-3 rounded-full transition-all duration-500" style={{ width: `${stats.attendance_rate}%` }}></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{stats.present_today} present</span>
            <span>{stats.absent_today} absent</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Attendance Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Students per Section</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Attendance Trend (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} domain={[0, 100]} unit="%" />
            <Tooltip formatter={(value) => [`${value}%`, 'Rate']} labelFormatter={(label) => `Date: ${label}`} />
            <Line type="monotone" dataKey="rate" stroke="#111827" strokeWidth={2.5} dot={{ r: 3, fill: '#111827' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
