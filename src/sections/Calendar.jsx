import { useState, useMemo } from 'react'
import './Calendar.css'

// ── Category config ──────────────────────────────────────────────────────────
const CAT = {
  holiday:  { color: '#DC2626', bg: '#FFF1F0', label: 'Libur Nasional', badge: 'Libur' },
  religious:{ color: '#7C3AED', bg: '#F5F3FF', label: 'Keagamaan',      badge: 'Nasional' },
  birthday: { color: '#EC4899', bg: '#FDF2F8', label: 'Ulang Tahun',    badge: 'Ulang Tahun' },
  company:  { color: '#2563EB', bg: '#EFF6FF', label: 'ER Events',      badge: 'ER' },
}

const FILTERS = [
  { key: 'holiday',   label: 'Libur' },
  { key: 'religious', label: 'Nasional' },
  { key: 'birthday',  label: 'Ulang Tahun' },
  { key: 'company',   label: 'ER Events' },
]

const MONTHS_ID  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAY_ABBR   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Helpers ──────────────────────────────────────────────────────────────────
function toISO(y, m1, d) {
  return `${y}-${String(m1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function buildEventMap(calEvents, employees, year) {
  const map = {}

  calEvents.forEach(ev => {
    if (!ev.date) return
    if (parseInt(ev.date.slice(0, 4)) !== year) return
    if (!map[ev.date]) map[ev.date] = []
    map[ev.date].push({ title: ev.title, category: ev.category })
  })

  employees.forEach(emp => {
    if (!emp.birthDate || !emp.nama) return
    const [dd, mm] = emp.birthDate.split('/')
    const day = parseInt(dd), month = parseInt(mm)
    if (!day || !month || month > 12) return
    const key = toISO(year, month, day)
    if (!map[key]) map[key] = []
    const name = emp.nama.split(' ').slice(0, 2).join(' ')
    if (!map[key].some(e => e.title.toLowerCase().includes(name.toLowerCase()))) {
      map[key].push({ title: `${name} (${emp.entity})`, category: 'birthday' })
    }
  })

  return map
}

function countdown(dateStr) {
  const diff = Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / 86400000)
  if (diff <= 0) return 'Hari ini'
  if (diff === 1) return 'Besok'
  if (diff < 30) return `~${diff}d lagi`
  return `~${Math.round(diff / 30)} bln lagi`
}

// ── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ year, monthIdx, eventMap, selectedDate, onSelectDate }) {
  const today  = new Date()
  const isNow  = today.getFullYear() === year && today.getMonth() === monthIdx
  const daysInMonth  = new Date(year, monthIdx + 1, 0).getDate()
  const firstWeekday = new Date(year, monthIdx, 1).getDay()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="mc-card">
      <div className="mc-title">{MONTHS_ID[monthIdx].toUpperCase()} {year}</div>
      <div className="mc-grid">
        {DAY_ABBR.map(d => <span key={d} className="mc-hdr">{d}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={`_${i}`} />
          const key  = toISO(year, monthIdx + 1, day)
          const evs  = eventMap[key] || []
          const isToday = isNow && today.getDate() === day
          const isSel   = selectedDate === key
          const dotColor = evs.length ? (CAT[evs[0].category]?.color || '#DC2626') : null

          return (
            <button
              key={key}
              className={['mc-day', isToday ? 'mc-today' : '', isSel ? 'mc-sel' : ''].filter(Boolean).join(' ')}
              onClick={() => onSelectDate(isSel ? null : key)}
              title={evs.map(e => e.title).join('\n') || undefined}
            >
              {day}
              {dotColor && <span className="mc-dot" style={{ background: dotColor }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Calendar({ data }) {
  const calendarEvents = data?.calendarEvents || []
  const employees      = data?.employees      || []

  const now      = new Date()
  const thisYear = now.getFullYear()
  const curMonth = now.getMonth()
  const nextMonth = (curMonth + 1) % 12
  const nextMonthYear = nextMonth === 0 ? thisYear + 1 : thisYear

  const [year,         setYear]         = useState(thisYear)
  const [activeFilters,setActiveFilters]= useState(new Set())
  const [selectedDate, setSelectedDate] = useState(null)

  // Event maps
  const yearMap    = useMemo(() => buildEventMap(calendarEvents, employees, year),    [calendarEvents, employees, year])
  const curYearMap = useMemo(() => year === thisYear ? yearMap : buildEventMap(calendarEvents, employees, thisYear), [calendarEvents, employees, year, thisYear, yearMap])

  // Upcoming (always from today +90 days)
  const todayStr = now.toISOString().slice(0, 10)
  const limit    = new Date(now); limit.setDate(now.getDate() + 90)
  const limitStr = limit.toISOString().slice(0, 10)

  const allUpcoming = useMemo(() => {
    const list = []
    Object.entries(curYearMap).forEach(([date, evs]) => {
      if (date >= todayStr && date <= limitStr)
        evs.forEach(ev => list.push({ date, ...ev }))
    })
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [curYearMap, todayStr, limitStr])

  const upcoming = useMemo(
    () => activeFilters.size === 0
      ? allUpcoming
      : allUpcoming.filter(ev => activeFilters.has(ev.category)),
    [allUpcoming, activeFilters]
  )

  const totalYearEvents = Object.values(yearMap).reduce((s, a) => s + a.length, 0)

  function toggleFilter(key) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const selectedEvs = selectedDate
    ? (curYearMap[selectedDate] || yearMap[selectedDate] || [])
    : []

  return (
    <div className="cal2-page">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="cal2-header">
        <div className="cal2-header-left">
          <div className="cal2-title-row">
            <h1 className="page-title">Kalender ER</h1>
            <span className="badge badge-blue">{totalYearEvents} event {year}</span>
          </div>
          <p className="cal2-subtitle">
            90 hari ke depan &bull; <strong>{allUpcoming.length}</strong> event upcoming
          </p>
        </div>
        <div className="cal2-header-right">
          <div className="cal2-filters">
            {FILTERS.map(({ key, label }) => {
              const cfg    = CAT[key]
              const active = activeFilters.has(key)
              return (
                <button
                  key={key}
                  className={`cal2-filter ${active ? 'cal2-filter-on' : ''}`}
                  style={active
                    ? { background: cfg.color, borderColor: cfg.color, color: '#fff' }
                    : { borderColor: cfg.color, color: cfg.color }}
                  onClick={() => toggleFilter(key)}
                >
                  <span className="cal2-filter-dot" style={{ background: active ? 'rgba(255,255,255,0.8)' : cfg.color }} />
                  {label}
                </button>
              )
            })}
          </div>
          <div className="cal2-year-nav">
            <button className="cal2-nav-btn" onClick={() => { setYear(y => y - 1); setSelectedDate(null) }}>‹</button>
            <span className="cal2-year-lbl">{year}</span>
            <button className="cal2-nav-btn" onClick={() => { setYear(y => y + 1); setSelectedDate(null) }}>›</button>
          </div>
        </div>
      </div>

      {/* ══ MAIN 2-COLUMN GRID ══════════════════════════════════════════════ */}
      <div className="cal2-main">

        {/* LEFT: Upcoming Events */}
        <div className="cal2-left">
          <div className="cal2-panel-hdr">
            <span className="cal2-panel-title">UPCOMING EVENTS</span>
            <span className="cal2-panel-sub">90 hari ke depan</span>
          </div>

          {upcoming.length === 0 ? (
            <div className="cal2-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
              <p>Tidak ada event dalam 90 hari ke depan</p>
              {activeFilters.size > 0 && (
                <button className="cal2-clear-filter" onClick={() => setActiveFilters(new Set())}>
                  Hapus filter
                </button>
              )}
            </div>
          ) : (
            <div className="cal2-ev-list">
              {upcoming.map((ev, i) => {
                const cfg = CAT[ev.category] || CAT.company
                const d   = new Date(ev.date + 'T00:00:00')
                const sel = selectedDate === ev.date
                return (
                  <div
                    key={`${ev.date}-${i}`}
                    className={`cal2-ev-row${sel ? ' cal2-ev-sel' : ''}`}
                    style={{ animationDelay: `${i * 0.04}s` }}
                    onClick={() => setSelectedDate(sel ? null : ev.date)}
                  >
                    {/* Date badge */}
                    <div className="cal2-ev-datebadge" style={{ background: cfg.bg, borderColor: cfg.color }}>
                      <span className="cal2-ev-day"  style={{ color: cfg.color }}>{d.getDate()}</span>
                      <span className="cal2-ev-mon"  style={{ color: cfg.color }}>{MONTHS_ID[d.getMonth()].slice(0,3).toUpperCase()}</span>
                    </div>
                    {/* Content */}
                    <div className="cal2-ev-content">
                      <div className="cal2-ev-title">{ev.title}</div>
                      <div className="cal2-ev-meta">
                        <span className="cal2-ev-type">{cfg.label}</span>
                        <span className="cal2-ev-badge" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.badge}
                        </span>
                      </div>
                    </div>
                    {/* Countdown */}
                    <div className="cal2-ev-countdown">{countdown(ev.date)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Mini Calendars */}
        <div className="cal2-right">

          <MiniCalendar
            year={thisYear}
            monthIdx={curMonth}
            eventMap={curYearMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <div className="cal2-divider" />

          <MiniCalendar
            year={nextMonthYear}
            monthIdx={nextMonth}
            eventMap={curYearMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Year nav (bottom of right panel) */}
          <div className="cal2-right-year">
            <button className="cal2-nav-btn" onClick={() => { setYear(y => y - 1); setSelectedDate(null) }}>‹</button>
            <span className="cal2-year-lbl">{year}</span>
            <button className="cal2-nav-btn" onClick={() => { setYear(y => y + 1); setSelectedDate(null) }}>›</button>
          </div>

          {/* Selected date detail */}
          {selectedDate && selectedEvs.length > 0 && (
            <div className="cal2-detail">
              <div className="cal2-detail-hdr">
                <span className="cal2-detail-date">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <button className="cal2-detail-close" onClick={() => setSelectedDate(null)}>✕</button>
              </div>
              {selectedEvs.map((ev, i) => {
                const cfg = CAT[ev.category] || CAT.company
                return (
                  <div key={i} className="cal2-detail-ev" style={{ borderLeftColor: cfg.color }}>
                    <span className="cal2-ev-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.badge}</span>
                    <span className="cal2-detail-ev-name">{ev.title}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
