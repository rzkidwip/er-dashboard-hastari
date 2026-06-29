import { useState, useMemo } from 'react'
import { MapPin, User, Banknote, CheckCircle2, Clock, CalendarClock, Users,
         ChevronDown, ChevronUp, Search, X, ChevronsUpDown } from 'lucide-react'
import './Events.css'

const STATUS = {
  completed : { label:'Completed', color:'var(--green)',  bg:'var(--green-light)',  Icon: CheckCircle2 },
  'on-going': { label:'On-Going',  color:'var(--blue)',   bg:'var(--blue-light)',   Icon: Clock },
  upcoming  : { label:'Upcoming',  color:'var(--orange)', bg:'var(--orange-light)', Icon: CalendarClock },
  planning  : { label:'Planning',  color:'var(--orange)', bg:'var(--orange-light)', Icon: CalendarClock },
}

const ENTITY_COLOR = {
  HAI: '#007AFF', HAP: '#34C759', ASI: '#FF9500',
  BPN: '#AF52DE', CMS: '#FF3B30', IAS: '#5AC8FA', HPA: '#5856D6',
  HCGA: '#FF3B30', FAT: '#FF9500', OPERATION: '#34C759',
  LEGAL: '#6366F1', SECRETARY: '#14B8A6', PROCUREMENT: '#F97316',
}

function getStatus(raw='') {
  return STATUS[raw.toLowerCase()] || { label:raw||'N/A', color:'var(--label-3)', bg:'var(--surface-2)', Icon: Clock }
}
function parseRp(s){ return parseInt(String(s||'0').replace(/[^0-9]/g,''))||0 }
function initials(name) { return name.split(' ').slice(0,2).map(n=>n[0]||'').join('').toUpperCase() }
function entityColor(entity='') {
  const up = entity.toUpperCase()
  const key = Object.keys(ENTITY_COLOR).find(k => up.includes(k))
  return key ? ENTITY_COLOR[key] : '#8E8E93'
}
function shortName(name='') {
  const words = name.split(/[\s,&]+/).filter(Boolean)
  return words.slice(0, 2).join(' ') + (words.length > 2 ? '…' : '')
}
function detectResign(v) {
  return !v.nik?.trim() && !v.entity?.trim()
}

// Sort icon helper
function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown size={11} style={{opacity:.35, marginLeft:3, verticalAlign:'middle'}}/>
  return sortDir === 'asc'
    ? <ChevronUp   size={11} style={{color:'var(--blue)', marginLeft:3, verticalAlign:'middle'}}/>
    : <ChevronDown size={11} style={{color:'var(--blue)', marginLeft:3, verticalAlign:'middle'}}/>
}

export default function Events({ data }) {
  const events     = data?.events     || []
  const volunteers = data?.volunteers || []

  const [expanded,    setExpanded]    = useState(new Set())
  const [query,       setQuery]       = useState('')
  const [activeEvent, setActiveEvent] = useState('Semua')
  const [popupEvent,  setPopupEvent]  = useState(null)
  const [sortCol,     setSortCol]     = useState('total')
  const [sortDir,     setSortDir]     = useState('desc')

  const done  = events.filter(e => e.status?.toLowerCase().includes('complet')).length
  const total = events.reduce((s,e) => s + parseRp(e.budget), 0)

  // ── Events with volunteer data (ordered from events sheet) ──────────────
  const trackedEvents = useMemo(() => {
    const hasVol = new Set(volunteers.map(v => v.eventName))
    return events.filter(ev => hasVol.has(ev.eventName))
  }, [events, volunteers])

  // ── Build master participant list ────────────────────────────────────────
  const masterList = useMemo(() => {
    const map = {}
    volunteers.forEach(v => {
      if (!v.volunteerName) return
      const resign = detectResign(v)
      const key    = (v.nik && !resign) ? v.nik : `_n_${v.volunteerName}`
      if (!map[key]) {
        map[key] = {
          name:     v.volunteerName,
          nik:      resign ? '' : (v.nik    || ''),
          entity:   resign ? '' : (v.entity || ''),
          isResign: resign,
          attendance: {},
        }
      } else {
        if (resign) map[key].isResign = true
        if (!map[key].nik    && v.nik    && !resign) map[key].nik    = v.nik
        if (!map[key].entity && v.entity && !resign) map[key].entity = v.entity
      }
      if (!resign) map[key].attendance[v.eventName] = true
    })
    return Object.values(map)
  }, [volunteers])

  // ── Popup volunteers ─────────────────────────────────────────────────────
  const popupVols = useMemo(() => {
    if (!popupEvent) return []
    return volunteers.filter(v => v.eventName === popupEvent.eventName)
  }, [popupEvent, volunteers])

  // ── Sort handler ─────────────────────────────────────────────────────────
  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir(col === 'total' ? 'desc' : 'asc') }
  }

  // ── Filtered + sorted list ───────────────────────────────────────────────
  const filteredList = useMemo(() => {
    const q = query.toLowerCase().trim()
    const filtered = masterList.filter(p => {
      const matchQ = !q
        || p.name.toLowerCase().includes(q)
        || p.nik.includes(q)
        || p.entity.toLowerCase().includes(q)
      const matchEv = activeEvent === 'Semua' || p.attendance[activeEvent]
      return matchQ && matchEv
    })

    return [...filtered].sort((a, b) => {
      // Resign always at bottom regardless of sort
      if (a.isResign !== b.isResign) return a.isResign ? 1 : -1
      let cmp = 0
      if (sortCol === 'name')   cmp = a.name.localeCompare(b.name)
      else if (sortCol === 'nik')    cmp = a.nik.localeCompare(b.nik)
      else if (sortCol === 'entity') cmp = a.entity.localeCompare(b.entity)
      else if (sortCol === 'total')  cmp = Object.keys(a.attendance).length - Object.keys(b.attendance).length
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [masterList, query, activeEvent, sortCol, sortDir])

  function toggle(key) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const activeCount = masterList.filter(p => !p.isResign).length
  const resignCount = masterList.filter(p => p.isResign).length

  return (
    <div className="events-page">
      <div className="page-row" style={{marginBottom:18}}>
        <h1 className="page-title">Internal Events</h1>
        <div style={{display:'flex',gap:8}}>
          <span className="badge badge-green"><CheckCircle2 size={12}/>{done} Selesai</span>
          <span className="badge badge-blue">{events.length} Total</span>
          <span className="badge badge-red"><Banknote size={12}/>Rp {(total/1e6).toFixed(1)}M</span>
        </div>
      </div>

      {/* ── Event cards ── */}
      <div className="events-grid">
        {events.map((ev,i) => {
          const s    = getStatus(ev.status)
          const vols = volunteers.filter(v => v.eventName === ev.eventName && !detectResign(v))
          const key  = ev.eventName || i
          const open = expanded.has(key)

          return (
            <div className="card event-card" key={i}>
              <div className="ev-top">
                <span className="ev-status-chip" style={{background:s.bg, color:s.color}}>
                  <s.Icon size={11} strokeWidth={2.5}/>{s.label}
                </span>
                <span className="ev-date">{ev.date}</span>
              </div>
              <h3 className="ev-title">{ev.eventName}</h3>
              {ev.venue && <p className="ev-row"><MapPin size={12} color="var(--label-3)"/>{ev.venue}</p>}
              {ev.description && <p className="ev-desc">{ev.description}</p>}
              <div className="ev-footer">
                <span className="ev-row"><User size={12} color="var(--label-3)"/>{ev.organizer||'—'}</span>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  {vols.length > 0 && <span className="ev-row"><Users size={12} color="var(--blue)"/>{vols.length} vol.</span>}
                  <span className="ev-budget">Rp {parseRp(ev.budget).toLocaleString('id-ID')}</span>
                </div>
              </div>
              {vols.length > 0 && (
                <button className="ev-expand-btn" onClick={() => toggle(key)}>
                  {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  Volunteers ({vols.length})
                </button>
              )}
              {open && (
                <div className="ev-panel">
                  <p className="ev-panel-title">✓ VOLUNTEERS IN THIS EVENT ({vols.length})</p>
                  <div className="ev-vol-list">
                    {vols.map((v, vi) => (
                      <div className="ev-vol-item" key={vi}>
                        <div className="ev-vol-avatar" style={{background: entityColor(v.entity)}}>
                          {initials(v.volunteerName)}
                        </div>
                        <div className="ev-vol-info">
                          <div className="ev-vol-name-row">
                            <span className="ev-vol-name">{v.volunteerName}</span>
                            {v.entity && <span className="ev-vol-entity">({v.entity})</span>}
                          </div>
                          <span className="ev-vol-role">{v.role || 'Participant'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {events.length === 0 && <p style={{color:'var(--label-3)',padding:32}}>Belum ada event</p>}
      </div>

      {/* ══ ATTENDANCE TRACKING TABLE ══ */}
      {masterList.length > 0 && (
        <div className="att-card">
          {/* Header */}
          <div className="att-header">
            <span className="att-icon">📊</span>
            <div>
              <div className="att-title">Event Attendance Tracking (2026)</div>
              <div className="att-sub">
                {activeCount} peserta aktif · {trackedEvents.length} events
                {resignCount > 0 && <span className="att-resign-pill">{resignCount} resign</span>}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="att-toolbar">
            <div className="att-search">
              <Search size={14} color="var(--label-3)"/>
              <input
                className="att-search-input"
                placeholder="Cari nama, NIK, departemen…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && <button className="att-clear" onClick={() => setQuery('')}>✕</button>}
            </div>
            <div className="att-tabs">
              <button
                className={`att-tab ${activeEvent === 'Semua' ? 'att-tab-active' : ''}`}
                onClick={() => setActiveEvent('Semua')}
              >Semua</button>
              {trackedEvents.map(ev => (
                <button
                  key={ev.eventName}
                  className={`att-tab ${activeEvent === ev.eventName ? 'att-tab-active' : ''}`}
                  onClick={() => setActiveEvent(ev.eventName)}
                  title={ev.eventName}
                >{shortName(ev.eventName)}</button>
              ))}
            </div>
          </div>

          <div className="att-info-row">
            Menampilkan <strong>{filteredList.length}</strong> dari {masterList.length} peserta
            <span className="att-info-hint"> · Klik header event untuk melihat volunteers · Klik kolom untuk sort</span>
          </div>

          {/* Table */}
          <div className="att-table-wrap">
            <table className="att-table">
              <thead>
                <tr>
                  <th className="att-th-num">#</th>
                  <th className="att-th-name att-th-sort" onClick={() => handleSort('name')}>
                    Nama Peserta <SortIcon col="name" sortCol={sortCol} sortDir={sortDir}/>
                  </th>
                  <th className="att-th-nik att-th-sort" onClick={() => handleSort('nik')}>
                    NIK <SortIcon col="nik" sortCol={sortCol} sortDir={sortDir}/>
                  </th>
                  <th className="att-th-div att-th-sort" onClick={() => handleSort('entity')}>
                    Divisi <SortIcon col="entity" sortCol={sortCol} sortDir={sortDir}/>
                  </th>
                  {trackedEvents.map(ev => (
                    <th
                      key={ev.eventName}
                      className="att-th-ev att-th-ev-btn"
                      title={`Klik untuk lihat volunteers: ${ev.eventName}`}
                      onClick={() => setPopupEvent(ev)}
                    >
                      {shortName(ev.eventName)}
                      {ev.date && <div className="att-th-ev-date">{ev.date}</div>}
                    </th>
                  ))}
                  <th className="att-th-total att-th-sort" onClick={() => handleSort('total')}>
                    Total <SortIcon col="total" sortCol={sortCol} sortDir={sortDir}/>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((p, i) => {
                  const totalCount = Object.keys(p.attendance).length
                  return (
                    <tr key={`${p.name}-${i}`} className={p.isResign ? 'att-row-resign' : ''}>
                      <td className="att-td-num">{i + 1}</td>
                      <td className="att-td-name">
                        {p.isResign && <span className="att-resign-dot"/>}
                        <span style={{textDecoration: p.isResign ? 'line-through' : 'none'}}>{p.name}</span>
                        {p.isResign && <span className="att-resign-label">Resign</span>}
                      </td>
                      <td className="att-td-nik">
                        {p.isResign || !p.nik ? <span className="att-empty">—</span> : p.nik}
                      </td>
                      <td className="att-td-div">
                        {p.isResign || !p.entity
                          ? <span className="att-empty">—</span>
                          : <span className="att-entity-badge" style={{color: entityColor(p.entity), background: entityColor(p.entity)+'18'}}>{p.entity}</span>}
                      </td>
                      {trackedEvents.map(ev => {
                        const attended = !p.isResign && p.attendance[ev.eventName]
                        return (
                          <td key={ev.eventName} className="att-td-ev">
                            {attended
                              ? <span className="att-check">✓</span>
                              : <span className="att-cross">✗</span>}
                          </td>
                        )
                      })}
                      <td className="att-td-total">
                        {p.isResign
                          ? <span className="att-empty">—</span>
                          : <span className="att-total-badge" style={{
                              background: totalCount >= trackedEvents.length ? '#10B981'
                                : totalCount >= Math.ceil(trackedEvents.length / 2) ? '#007AFF'
                                : '#8E8E93'
                            }}>{totalCount}</span>}
                      </td>
                    </tr>
                  )
                })}
                {filteredList.length === 0 && (
                  <tr><td colSpan={4 + trackedEvents.length + 1} className="att-empty-row">Tidak ada data yang cocok</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Event volunteers popup ── */}
      {popupEvent && (
        <div className="att-popup-overlay" onClick={() => setPopupEvent(null)}>
          <div className="att-popup" onClick={e => e.stopPropagation()}>
            <div className="att-popup-header">
              <div className="att-popup-title-wrap">
                <span className="att-popup-check">✓</span>
                <div>
                  <div className="att-popup-title">{popupEvent.eventName}</div>
                  {popupEvent.date && <div className="att-popup-date">{popupEvent.date}</div>}
                </div>
              </div>
              <button className="att-popup-close" onClick={() => setPopupEvent(null)}><X size={16}/></button>
            </div>
            <div className="att-popup-body">
              <div className="att-popup-sub">Volunteers ({popupVols.length})</div>
              <div className="att-popup-list">
                {popupVols.map((v, vi) => {
                  const resign = detectResign(v)
                  return (
                    <div className={`att-popup-item ${resign ? 'att-popup-item-resign' : ''}`} key={vi}>
                      <div className="att-popup-avatar" style={{background: resign ? '#8E8E93' : entityColor(v.entity)}}>
                        {initials(v.volunteerName)}
                      </div>
                      <div className="att-popup-info">
                        <div className="att-popup-name-row">
                          <span className="att-popup-name" style={{textDecoration: resign ? 'line-through' : 'none'}}>
                            {v.volunteerName}
                          </span>
                          {v.entity && !resign && <span className="att-popup-entity">({v.entity})</span>}
                          {resign && <span className="att-resign-label">Resign</span>}
                        </div>
                        {v.role && <span className="att-popup-role">{v.role}</span>}
                      </div>
                    </div>
                  )
                })}
                {popupVols.length === 0 && (
                  <p style={{color:'var(--label-3)',padding:'12px 0',fontSize:13}}>Tidak ada data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
