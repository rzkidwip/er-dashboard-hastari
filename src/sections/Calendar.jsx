import { useState, useMemo } from 'react'
import './Calendar.css'

const CAT = {
  holiday:  { color: '#FF3B30', bg: '#FFF1F0', label: 'Libur Resmi' },
  national: { color: '#FF9500', bg: '#FFF8F0', label: 'Hari Nasional' },
  birthday: { color: '#AF52DE', bg: '#F9F0FF', label: 'Ulang Tahun' },
  event:    { color: '#007AFF', bg: '#EFF6FF', label: 'ER Events' },
}

const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]
const DAY_ABBR = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

function toISO(year, month1, day) {
  return `${year}-${String(month1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function buildEventMap(calendarEvents, employees, year) {
  const map = {}

  calendarEvents.forEach(ev => {
    if (!ev.date) return
    const evYear = parseInt(ev.date.slice(0, 4))
    if (evYear !== year) return
    if (!map[ev.date]) map[ev.date] = []
    map[ev.date].push({ title: ev.title, category: ev.category })
  })

  employees.forEach(emp => {
    if (!emp.birthDate || !emp.nama) return
    const parts = emp.birthDate.split('/')
    if (parts.length < 3) return
    const day = parseInt(parts[0]), month = parseInt(parts[1])
    if (!day || !month || month > 12) return
    const key = toISO(year, month, day)
    if (!map[key]) map[key] = []
    const first2 = emp.nama.split(' ').slice(0, 2).join(' ')
    if (!map[key].some(e => e.title.toLowerCase().includes(first2.toLowerCase()))) {
      map[key].push({ title: `${first2} (${emp.entity})`, category: 'birthday' })
    }
  })

  return map
}

function MonthCard({ year, monthIdx, eventMap, selectedDate, onSelectDate }) {
  const today = new Date()
  const isCurrentYear  = today.getFullYear() === year
  const isCurrentMonth = isCurrentYear && today.getMonth() === monthIdx
  const daysInMonth    = new Date(year, monthIdx + 1, 0).getDate()
  const firstWeekday   = new Date(year, monthIdx, 1).getDay()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="cal-month-card">
      <div className="cal-month-name">{MONTHS_ID[monthIdx]}</div>
      <div className="cal-day-row cal-day-hdr">
        {DAY_ABBR.map(d => <span key={d}>{d}</span>)}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="cal-day-row">
          {week.map((day, di) => {
            if (!day) return <span key={di} className="cal-day-empty" />
            const key    = toISO(year, monthIdx + 1, day)
            const events = eventMap[key] || []
            const isToday    = isCurrentMonth && today.getDate() === day
            const isSelected = selectedDate === key
            const isSun      = di === 0
            const isSat      = di === 6

            return (
              <button
                key={key}
                className={[
                  'cal-day',
                  isToday    ? 'cal-today'    : '',
                  isSelected ? 'cal-selected' : '',
                  events.length ? 'cal-has-ev' : '',
                  isSun ? 'cal-sun' : '',
                  isSat ? 'cal-sat' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onSelectDate(isSelected ? null : key)}
              >
                <span className="cal-dn">{day}</span>
                {events.length > 0 && (
                  <span className="cal-dots">
                    {events.slice(0, 3).map((ev, j) => (
                      <span key={j} className="cal-dot" style={{ background: CAT[ev.category]?.color || '#8E8E93' }} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function fmtDate(key) {
  if (!key) return ''
  const d = new Date(key + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Calendar({ data }) {
  const calendarEvents = data?.calendarEvents || []
  const employees      = data?.employees      || []

  const [year, setYear]               = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)

  const eventMap      = useMemo(() => buildEventMap(calendarEvents, employees, year), [calendarEvents, employees, year])
  const selectedEvs   = selectedDate ? (eventMap[selectedDate] || []) : []

  const today    = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const limit    = new Date(today); limit.setDate(today.getDate() + 90)
  const limitStr = limit.toISOString().slice(0, 10)

  const upcoming = useMemo(() => {
    const list = []
    Object.entries(eventMap).forEach(([date, evs]) => {
      if (date >= todayStr && date <= limitStr)
        evs.forEach(ev => list.push({ date, ...ev }))
    })
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [eventMap, todayStr, limitStr])

  const totalEvents = Object.values(eventMap).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="cal-page">

      {/* ── Page header ── */}
      <div className="cal-top">
        <div className="cal-top-left">
          <h1 className="page-title">Kalender ER</h1>
          <span className="badge badge-blue">{totalEvents} event tahun ini</span>
        </div>
        <div className="cal-top-right">
          <div className="cal-legend">
            {Object.entries(CAT).map(([cat, cfg]) => (
              <span key={cat} className="cal-legend-item">
                <span className="cal-legend-dot" style={{ background: cfg.color }} />
                {cfg.label}
              </span>
            ))}
          </div>
          <div className="cal-year-nav">
            <button className="cal-nav-btn" onClick={() => { setYear(y => y - 1); setSelectedDate(null) }}>‹</button>
            <span className="cal-year-label">{year}</span>
            <button className="cal-nav-btn" onClick={() => { setYear(y => y + 1); setSelectedDate(null) }}>›</button>
          </div>
        </div>
      </div>

      {/* ── 12-month grid ── */}
      <div className="cal-grid">
        {Array.from({ length: 12 }, (_, i) => (
          <MonthCard
            key={i}
            year={year}
            monthIdx={i}
            eventMap={eventMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        ))}
      </div>

      {/* ── Selected date panel ── */}
      {selectedDate && selectedEvs.length > 0 && (
        <div className="cal-detail-panel">
          <div className="cal-detail-hdr">
            <span className="cal-detail-date">{fmtDate(selectedDate)}</span>
            <button className="cal-detail-close" onClick={() => setSelectedDate(null)}>✕</button>
          </div>
          <div className="cal-detail-events">
            {selectedEvs.map((ev, i) => {
              const cfg = CAT[ev.category] || CAT.event
              return (
                <div key={i} className="cal-ev-row" style={{ borderLeftColor: cfg.color }}>
                  <span className="cal-ev-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  <span className="cal-ev-title">{ev.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Upcoming events ── */}
      {upcoming.length > 0 && (
        <div className="card cal-upcoming">
          <div className="cal-upcoming-hdr">
            <span className="cal-upcoming-title">Upcoming Events</span>
            <span className="cal-upcoming-sub">90 hari ke depan · {upcoming.length} event</span>
          </div>
          <div className="cal-upcoming-list">
            {upcoming.map((ev, i) => {
              const cfg     = CAT[ev.category] || CAT.event
              const d       = new Date(ev.date + 'T00:00:00')
              const dayDiff = Math.round((d - today) / 86400000)
              return (
                <div key={i} className="cal-up-item">
                  <div className="cal-up-datecol">
                    <div className="cal-up-day">{d.getDate()}</div>
                    <div className="cal-up-mon">{MONTHS_ID[d.getMonth()].slice(0, 3)}</div>
                  </div>
                  <div className="cal-up-body">
                    <span className="cal-ev-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    <div className="cal-up-name">{ev.title}</div>
                  </div>
                  <div className="cal-up-countdown">
                    {dayDiff === 0
                      ? <span className="cal-countdown-today">Hari Ini</span>
                      : dayDiff === 1
                        ? <span className="cal-countdown-soon">Besok</span>
                        : <span className="cal-countdown-days">{dayDiff}h lagi</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
