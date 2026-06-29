import { useState } from 'react'
import { MapPin, User, Banknote, CheckCircle2, Clock, CalendarClock, Users, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
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
}

function getStatus(raw='') {
  return STATUS[raw.toLowerCase()] || { label:raw||'N/A', color:'var(--label-3)', bg:'var(--surface-2)', Icon: Clock }
}

function parseRp(s){ return parseInt(String(s||'0').replace(/[^0-9]/g,''))||0 }

function initials(name) {
  return name.split(' ').slice(0,2).map(n=>n[0]||'').join('').toUpperCase()
}

function entityColor(entity='') {
  const up  = entity.toUpperCase()
  const key = Object.keys(ENTITY_COLOR).find(k => up.includes(k))
  return key ? ENTITY_COLOR[key] : '#8E8E93'
}

export default function Events({ data }) {
  const events     = data?.events     || []
  const volunteers = data?.volunteers || []
  const [expanded, setExpanded] = useState(new Set())
  const [sortAsc,  setSortAsc]  = useState(false)

  const done  = events.filter(e => e.status?.toLowerCase().includes('complet')).length
  const total = events.reduce((s,e) => s + parseRp(e.budget), 0)

  // Build participation overview
  const countMap = {}
  const roleMap  = {}
  volunteers.forEach(v => {
    if (!v.volunteerName) return
    countMap[v.volunteerName] = (countMap[v.volunteerName] || 0) + 1
    if (!roleMap[v.volunteerName]) roleMap[v.volunteerName] = new Set()
    if (v.role) roleMap[v.volunteerName].add(v.role)
  })
  const overview = Object.entries(countMap)
    .sort((a,b) => sortAsc ? a[1]-b[1] : b[1]-a[1])
    .slice(0, 15)
    .map(([name, count], idx) => ({
      rank: idx+1, name, count,
      roles: [...(roleMap[name] || [])].join(', '),
    }))

  function toggle(key) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

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
          const vols = volunteers.filter(v => v.eventName === ev.eventName)
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

              {ev.venue && (
                <p className="ev-row"><MapPin size={12} color="var(--label-3)"/>{ev.venue}</p>
              )}
              {ev.description && (
                <p className="ev-desc">{ev.description}</p>
              )}

              <div className="ev-footer">
                <span className="ev-row"><User size={12} color="var(--label-3)"/>{ev.organizer||'—'}</span>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  {vols.length > 0 && (
                    <span className="ev-row"><Users size={12} color="var(--blue)"/>{vols.length} vol.</span>
                  )}
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
        {events.length === 0 && (
          <p style={{color:'var(--label-3)',padding:32}}>Belum ada event</p>
        )}
      </div>

      {/* ── Participation overview table ── */}
      {overview.length > 0 && (
        <div className="card ev-overview">
          <div className="ev-ov-header">
            <span className="ev-ov-title">📊 VOLUNTEER PARTICIPATION OVERVIEW (2026)</span>
            <span className="ev-ov-sub">{overview.length} volunteers</span>
          </div>
          <table className="ev-ov-table">
            <thead>
              <tr>
                <th className="ev-ov-col-num">#</th>
                <th>Volunteer</th>
                <th
                  className="ev-ov-col-count"
                  onClick={() => setSortAsc(p => !p)}
                >
                  Events <ArrowUpDown size={11} className="ev-ov-sort-icon"/>
                </th>
                <th className="ev-ov-col-roles">Roles</th>
              </tr>
            </thead>
            <tbody>
              {overview.map(r => (
                <tr key={r.rank}>
                  <td className="ev-ov-num">{r.rank}</td>
                  <td className="ev-ov-name">{r.name}</td>
                  <td className="ev-ov-count">{r.count}</td>
                  <td className="ev-ov-roles">{r.roles || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
