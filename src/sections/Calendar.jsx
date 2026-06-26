import { useState, useMemo, useEffect, useRef } from 'react'
import './Calendar.css'

// ── Config ───────────────────────────────────────────────────────────────────
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

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAY_ABBR  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Helpers ───────────────────────────────────────────────────────────────────
function toISO(y, m1, d) {
  return `${y}-${String(m1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function buildEventMap(calEvents, employees, year) {
  const map = {}
  calEvents.forEach(ev => {
    if (!ev.date || parseInt(ev.date.slice(0, 4)) !== year) return
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
    if (!map[key].some(e => e.title.toLowerCase().includes(name.toLowerCase())))
      map[key].push({ title: `${name} (${emp.entity})`, category: 'birthday' })
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

// ── Month Calendar (full-size) ────────────────────────────────────────────────
function MonthCalendar({ year, monthIdx, eventMap, selectedDate, onSelectDate, animClass }) {
  const today       = new Date()
  const isNow       = today.getFullYear() === year && today.getMonth() === monthIdx
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const firstDay    = new Date(year, monthIdx, 1).getDay()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className={`cal2-grid-wrap ${animClass}`}>
      <div className="cal2-wk-row">
        {DAY_ABBR.map((d, di) => (
          <span key={d} className={`cal2-wk-hdr${di === 0 ? ' cal2-wk-sun' : ''}`}>{d}</span>
        ))}
      </div>
      <div className="cal2-days">
        {cells.map((day, i) => {
          if (!day) return <span key={`_${i}`} className="cal2-day-empty" />
          const key       = toISO(year, monthIdx + 1, day)
          const evs       = eventMap[key] || []
          const isToday   = isNow && today.getDate() === day
          const isSel     = selectedDate === key
          const isSun     = (i % 7) === 0
          const isHoliday = evs.some(e => e.category === 'holiday' || e.category === 'religious')
          const isRed     = (isSun || isHoliday) && !isToday && !isSel

          return (
            <button
              key={key}
              className={[
                'cal2-day',
                isToday   ? 'cal2-day-today' : '',
                isSel     ? 'cal2-day-sel'   : '',
                isRed     ? 'cal2-day-red'   : '',
                evs.length? 'cal2-day-ev'    : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelectDate(isSel ? null : key)}
              title={evs.map(e => e.title).join('\n') || undefined}
            >
              <span className="cal2-day-num">{day}</span>
              {evs.length > 0 && (
                <span className="cal2-day-dots">
                  {evs.slice(0, 3).map((ev, j) => (
                    <span key={j} className="cal2-dot" style={{ background: CAT[ev.category]?.color || '#DC2626' }} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Month Picker ──────────────────────────────────────────────────────────────
function MonthPicker({ viewYear, viewMonth, onSelect, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="cal2-picker-wrap" ref={ref}>
      <div className="cal2-picker-year">{viewYear}</div>
      <div className="cal2-picker-grid">
        {MONTHS_ID.map((name, i) => (
          <button
            key={i}
            className={`cal2-picker-btn${viewMonth === i ? ' cal2-picker-active' : ''}`}
            onClick={() => onSelect(i)}
          >
            {name.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Calendar({ data }) {
  const calendarEvents = data?.calendarEvents || []
  const employees      = data?.employees      || []

  const now      = new Date()
  const thisYear = now.getFullYear()

  // Calendar view state
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear,  setViewYear]  = useState(thisYear)
  const [showPicker,setShowPicker]= useState(false)
  const [animClass, setAnimClass] = useState('')
  const [animKey,   setAnimKey]   = useState(0)

  // Filter + selection state
  const [activeFilters, setActiveFilters] = useState(new Set())
  const [selectedDate,  setSelectedDate]  = useState(null)

  // Header year nav (separate from view, for stats)
  const [year, setYear] = useState(thisYear)

  // Event maps
  const yearMap    = useMemo(() => buildEventMap(calendarEvents, employees, viewYear),  [calendarEvents, employees, viewYear])
  const curYearMap = useMemo(() => buildEventMap(calendarEvents, employees, thisYear),  [calendarEvents, employees, thisYear])
  const statMap    = useMemo(() => buildEventMap(calendarEvents, employees, year),      [calendarEvents, employees, year])

  // Upcoming (always today + 90 days)
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

  // Events for selected date
  const dateEvents = useMemo(() => {
    if (!selectedDate) return []
    const evs = yearMap[selectedDate] || curYearMap[selectedDate] || []
    return activeFilters.size === 0 ? evs : evs.filter(e => activeFilters.has(e.category))
  }, [selectedDate, yearMap, curYearMap, activeFilters])

  const totalYearEvents = Object.values(statMap).reduce((s, a) => s + a.length, 0)

  // Animation helper
  function navigate(dir) {
    const anim = dir === 'next' ? 'slide-left' : 'slide-right'
    setAnimClass(anim)
    setAnimKey(k => k + 1)
    setTimeout(() => setAnimClass(''), 300)

    let m = viewMonth, y = viewYear
    if (dir === 'next') { m++; if (m > 11) { m = 0; y++ } }
    else                { m--; if (m < 0)  { m = 11; y-- } }
    setViewMonth(m); setViewYear(y)
    setSelectedDate(null)
  }

  function pickMonth(monthIdx) {
    const dir = monthIdx > viewMonth ? 'slide-left' : 'slide-right'
    setAnimClass(dir)
    setAnimKey(k => k + 1)
    setTimeout(() => setAnimClass(''), 300)
    setViewMonth(monthIdx)
    setShowPicker(false)
    setSelectedDate(null)
  }

  function toggleFilter(key) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function handleDateSelect(key) {
    setSelectedDate(key)
  }

  // Left panel: show date events if selected, else upcoming
  const leftEvents   = selectedDate ? null : upcoming
  const leftTitle    = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'UPCOMING EVENTS'
  const leftSub = selectedDate ? `${dateEvents.length} event` : '90 hari ke depan'

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
              const cfg = CAT[key], active = activeFilters.has(key)
              return (
                <button
                  key={key}
                  className={`cal2-filter${active ? ' cal2-filter-on' : ''}`}
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
            <button className="cal2-nav-btn" onClick={() => setYear(y => y - 1)}>‹</button>
            <span className="cal2-year-lbl">{year}</span>
            <button className="cal2-nav-btn" onClick={() => setYear(y => y + 1)}>›</button>
          </div>
        </div>
      </div>

      {/* ══ MAIN 2-COLUMN ═══════════════════════════════════════════════════ */}
      <div className="cal2-main">

        {/* LEFT: Events */}
        <div className="cal2-left">
          <div className="cal2-panel-hdr">
            <div>
              <div className="cal2-panel-title">
                {selectedDate ? '📅 ' + leftTitle : 'UPCOMING EVENTS'}
              </div>
              <div className="cal2-panel-sub">{leftSub}</div>
            </div>
            {selectedDate && (
              <button className="cal2-back-btn" onClick={() => setSelectedDate(null)}>
                ← Semua
              </button>
            )}
          </div>

          {selectedDate ? (
            dateEvents.length === 0 ? (
              <div className="cal2-empty">
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <p>Tidak ada event pada tanggal ini</p>
                <button className="cal2-clear-filter" onClick={() => setSelectedDate(null)}>Lihat semua upcoming</button>
              </div>
            ) : (
              <div className="cal2-ev-list">
                {dateEvents.map((ev, i) => {
                  const cfg = CAT[ev.category] || CAT.company
                  const d   = new Date(selectedDate + 'T00:00:00')
                  return (
                    <div key={i} className="cal2-ev-row cal2-ev-sel" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="cal2-ev-datebadge" style={{ background: cfg.bg, borderColor: cfg.color }}>
                        <span className="cal2-ev-day" style={{ color: cfg.color }}>{d.getDate()}</span>
                        <span className="cal2-ev-mon" style={{ color: cfg.color }}>{MONTHS_ID[d.getMonth()].slice(0,3).toUpperCase()}</span>
                      </div>
                      <div className="cal2-ev-content">
                        <div className="cal2-ev-title">{ev.title}</div>
                        <div className="cal2-ev-meta">
                          <span className="cal2-ev-type">{cfg.label}</span>
                          <span className="cal2-ev-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.badge}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : upcoming.length === 0 ? (
            <div className="cal2-empty">
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗓️</div>
              <p>Tidak ada event dalam 90 hari ke depan</p>
              {activeFilters.size > 0 && (
                <button className="cal2-clear-filter" onClick={() => setActiveFilters(new Set())}>Hapus filter</button>
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
                    <div className="cal2-ev-datebadge" style={{ background: cfg.bg, borderColor: cfg.color }}>
                      <span className="cal2-ev-day" style={{ color: cfg.color }}>{d.getDate()}</span>
                      <span className="cal2-ev-mon" style={{ color: cfg.color }}>{MONTHS_ID[d.getMonth()].slice(0,3).toUpperCase()}</span>
                    </div>
                    <div className="cal2-ev-content">
                      <div className="cal2-ev-title">{ev.title}</div>
                      <div className="cal2-ev-meta">
                        <span className="cal2-ev-type">{cfg.label}</span>
                        <span className="cal2-ev-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.badge}</span>
                      </div>
                    </div>
                    <div className="cal2-ev-countdown">{countdown(ev.date)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Current Month Calendar */}
        <div className="cal2-right">

          {/* Month navigator */}
          <div className="cal2-month-nav">
            <button className="cal2-nav-btn cal2-nav-lg" onClick={() => navigate('prev')}>‹</button>
            <div style={{ position: 'relative' }}>
              <button className="cal2-month-title" onClick={() => setShowPicker(p => !p)}>
                {MONTHS_ID[viewMonth].toUpperCase()} {viewYear}
                <span className="cal2-picker-caret">{showPicker ? '▲' : '▼'}</span>
              </button>
              {showPicker && (
                <MonthPicker
                  viewYear={viewYear}
                  viewMonth={viewMonth}
                  onSelect={pickMonth}
                  onClose={() => setShowPicker(false)}
                />
              )}
            </div>
            <button className="cal2-nav-btn cal2-nav-lg" onClick={() => navigate('next')}>›</button>
          </div>

          {/* Calendar grid */}
          <div className="cal2-calendar-body">
            <MonthCalendar
              key={animKey}
              year={viewYear}
              monthIdx={viewMonth}
              eventMap={yearMap}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              animClass={animClass}
            />
          </div>

          {/* Category legend */}
          <div className="cal2-cal-legend">
            {Object.entries(CAT).map(([cat, cfg]) => (
              <span key={cat} className="cal2-cal-legend-item">
                <span className="cal2-cal-legend-dot" style={{ background: cfg.color }} />
                {cfg.badge}
              </span>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
