import { useMemo, useState } from 'react'
import { Trophy, Users, Activity, UserX, Search } from 'lucide-react'
import './Sports.css'

const SPORT_CFG = {
  Badminton: { emoji: '🏸', color: '#3B82F6', grad: 'linear-gradient(135deg,#3B82F6 0%,#1D4ED8 100%)', light: '#EFF6FF', border: '#BFDBFE' },
  Padel:     { emoji: '🎾', color: '#10B981', grad: 'linear-gradient(135deg,#10B981 0%,#059669 100%)', light: '#ECFDF5', border: '#A7F3D0' },
  Futsal:    { emoji: '⚽', color: '#EF4444', grad: 'linear-gradient(135deg,#EF4444 0%,#B91C1C 100%)', light: '#FEF2F2', border: '#FECACA' },
}

function detectResign(nik, entity) {
  const n = (nik || '').toUpperCase().trim()
  const e = (entity || '').trim()
  // Resign: kolom NIK berisi "RESIGN", atau NIK & entity dua-duanya kosong/dash
  return n === 'RESIGN' || n === '-' || (n === '' && (e === '' || e === '-'))
}

function normName(s) {
  return (s || '').toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
}

function fmtDate(d) {
  if (!d || d === '-') return null
  const [day, mon, yr] = (d || '').split('/')
  if (!day || !mon || !yr) return d
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des']
  return `${parseInt(day)} ${months[parseInt(mon) - 1]} ${yr}`
}

export default function Sports({ data }) {
  const sports    = data?.sports    || []
  const employees = data?.employees || []

  const [query,     setQuery]     = useState('')
  const [filterSesi, setFilterSesi] = useState('Semua')

  // ── Enrich helpers ──────────────────────────────────────────────────────────
  const { byNik, byName } = useMemo(() => {
    const byNik = {}, byName = {}
    employees.forEach(e => {
      if (e.nik)  byNik[e.nik]          = e
      byName[normName(e.nama)]           = e
    })
    return { byNik, byName }
  }, [employees])

  function enrich(participant, nik, entity) {
    let emp = null
    if (nik && nik !== '-') emp = byNik[nik]
    if (!emp) emp = byName[normName(participant)]
    return {
      nik:      emp?.nik      || (nik && nik !== '-' ? nik : ''),
      entity:   emp?.entity   || (entity && entity !== '-' ? entity : ''),
      jobTitle: emp?.jobTitle || '',
    }
  }

  // ── Build sessions (ordered by event number) ─────────────────────────────
  const sessions = useMemo(() => {
    const map = {}
    sports.forEach(s => {
      if (!s.category || !s.participant) return
      const evNum = (s.eventNo || '').toString().trim() || '?'
      if (!map[evNum]) map[evNum] = { evNum, category: s.category, date: null, rows: [] }
      if (s.date && s.date !== '-' && !map[evNum].date) map[evNum].date = s.date
      if (!map[evNum].category && s.category) map[evNum].category = s.category
      map[evNum].rows.push(s)
    })
    return Object.values(map).sort((a, b) => Number(a.evNum) - Number(b.evNum))
  }, [sports])

  // ── Build master list (unique participants across all sessions) ──────────
  const masterList = useMemo(() => {
    const master = {}
    sessions.forEach(sess => {
      sess.rows.forEach(s => {
        const resign = detectResign(s.nik, s.entity)
        const pKey   = (s.nik && s.nik !== '-' && !resign) ? s.nik : `_n_${s.participant}`
        if (!master[pKey]) {
          const info = enrich(s.participant, s.nik, s.entity)
          master[pKey] = { name: s.participant, ...info, isResign: resign, sessions: {} }
        } else {
          const cur = master[pKey]
          if (!cur.nik     && s.nik    && s.nik    !== '-') cur.nik    = s.nik
          if (!cur.entity  && s.entity && s.entity !== '-') cur.entity = s.entity
        }
        master[pKey].sessions[sess.evNum] = true
      })
    })
    return Object.values(master).sort((a, b) => {
      if (a.isResign !== b.isResign) return a.isResign ? 1 : -1
      return Object.keys(b.sessions).length - Object.keys(a.sessions).length || a.name.localeCompare(b.name)
    })
  }, [sessions, byNik, byName])

  // ── Summary stats ────────────────────────────────────────────────────────
  const { totalUnique, totalResign, mostActive } = useMemo(() => {
    const active  = masterList.filter(p => !p.isResign)
    const byCount = [...active].sort((a, b) => Object.keys(b.sessions).length - Object.keys(a.sessions).length)
    return {
      totalUnique:  masterList.length,
      totalResign:  masterList.filter(p => p.isResign).length,
      mostActive:   byCount[0] || null,
    }
  }, [masterList])

  // ── Filter for master table ──────────────────────────────────────────────
  const filteredMaster = useMemo(() => {
    const q = query.toLowerCase().trim()
    return masterList.filter(p => {
      const matchQ = !q
        || p.name.toLowerCase().includes(q)
        || p.nik.includes(q)
        || p.entity.toLowerCase().includes(q)
      const matchSesi = filterSesi === 'Semua' || p.sessions[filterSesi]
      return matchQ && matchSesi
    })
  }, [masterList, query, filterSesi])

  if (!sports.length) return (
    <div className="sports-empty">
      <div className="sports-empty-icon">🏅</div>
      <p>Memuat data sports…</p>
    </div>
  )

  return (
    <div className="sports-page">
      <h1 className="page-title" style={{ marginBottom: 18 }}>Sports Events</h1>

      {/* ── Hero KPI ── */}
      <div className="sports-hero">
        <div className="sh-kpi">
          <div className="sh-kpi-icon" style={{ background: '#EFF6FF' }}><Users size={18} color="#3B82F6" /></div>
          <div className="sh-kpi-val">{totalUnique}</div>
          <div className="sh-kpi-lbl">Total Peserta</div>
        </div>
        <div className="sh-kpi">
          <div className="sh-kpi-icon" style={{ background: '#ECFDF5' }}><Activity size={18} color="#10B981" /></div>
          <div className="sh-kpi-val">{sessions.length}</div>
          <div className="sh-kpi-lbl">Total Kegiatan</div>
        </div>
        <div className="sh-kpi">
          <div className="sh-kpi-icon" style={{ background: '#FFFBEB' }}><Trophy size={18} color="#F59E0B" /></div>
          <div className="sh-kpi-val sh-kpi-name">
            {mostActive ? mostActive.name.split(' ').slice(0, 2).join(' ') : '—'}
          </div>
          <div className="sh-kpi-lbl">
            Most Active
            {mostActive && (
              <span className="sh-count-chip">{Object.keys(mostActive.sessions).length}x</span>
            )}
          </div>
        </div>
        <div className="sh-kpi">
          <div className="sh-kpi-icon" style={{ background: '#FEF2F2' }}><UserX size={18} color="#EF4444" /></div>
          <div className="sh-kpi-val sh-kpi-resign">{totalResign}</div>
          <div className="sh-kpi-lbl">Resign</div>
        </div>
      </div>

      {/* ── Session Cards (ordered by event number) ── */}
      <div className="sports-sections">
        {sessions.map((sess, sIdx) => {
          const cfg = SPORT_CFG[sess.category] || { emoji:'🏅', color:'#8E8E93', grad:'linear-gradient(135deg,#8E8E93,#636366)', light:'#F2F2F7', border:'#E5E5EA' }
          const rows    = sess.rows
          const resign  = rows.filter(r => detectResign(r.nik, r.entity))
          const active  = rows.filter(r => !detectResign(r.nik, r.entity))

          return (
            <div key={sess.evNum} className="ss-card">
              {/* Gradient header */}
              <div className="ss-header" style={{ background: cfg.grad }}>
                <div className="ss-header-left">
                  <span className="ss-emoji">{cfg.emoji}</span>
                  <div>
                    <div className="ss-sesi-label">SESI {sess.evNum}</div>
                    <div className="ss-title">{sess.category}</div>
                    <div className="ss-meta">
                      {fmtDate(sess.date) || '—'} &bull; {rows.length} peserta
                    </div>
                  </div>
                </div>
                <div className="ss-header-right">
                  <div className="ss-stat-pill">
                    <span className="ss-stat-dot" style={{ background: '#86EFAC' }} />
                    {active.length} Active
                  </div>
                  {resign.length > 0 && (
                    <div className="ss-stat-pill">
                      <span className="ss-stat-dot" style={{ background: '#FCA5A5' }} />
                      {resign.length} Resign
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance table — always visible */}
              <div className="ss-body" style={{ padding: 0 }}>
                <table className="ss-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: 'center' }}>#</th>
                      <th style={{ width: 32 }} />
                      <th>Nama Peserta</th>
                      <th>NIK</th>
                      <th>Departemen / Entity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const resign  = detectResign(r.nik, r.entity)
                      const info    = enrich(r.participant, r.nik, r.entity)
                      const nikShow = info.nik || r.nik
                      const entShow = info.entity || r.entity

                      return (
                        <tr key={i} className={resign ? 'ss-row-resign' : ''}>
                          <td className="ss-td-no">{i + 1}</td>
                          <td style={{ textAlign: 'center', fontSize: 14, paddingRight: 0 }}>
                            {resign ? '🔴' : '✅'}
                          </td>
                          <td className="ss-td-name">
                            <span style={{ textDecoration: resign ? 'line-through' : 'none', color: resign ? 'var(--label-3)' : 'var(--label)' }}>
                              {r.participant}
                            </span>
                            {resign && <span className="ss-resign-label">Resign</span>}
                          </td>
                          <td className="ss-td-nik">
                            {resign ? <span style={{ color: 'var(--label-4)' }}>—</span> : (nikShow && nikShow !== '-' ? nikShow : <span style={{ color: 'var(--label-4)' }}>—</span>)}
                          </td>
                          <td>
                            {!resign && entShow && entShow !== '-'
                              ? <span className="ss-entity-badge" style={{ background: cfg.light, color: cfg.color }}>{entShow}</span>
                              : <span style={{ color: 'var(--label-4)' }}>—</span>}
                          </td>
                          <td>
                            {resign
                              ? <span className="ss-badge-resign">Resign</span>
                              : <span className="ss-badge-attended">Attended</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ SUMMARY TABEL ══ */}
      <div className="master-card">
        <div className="master-header-static">
          <span className="master-icon">📊</span>
          <div>
            <div className="master-title">Ringkasan Keikutsertaan Sportsday</div>
            <div className="master-sub">{masterList.length} peserta · siapa ikut sesi mana</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="master-toolbar">
          <div className="master-search">
            <Search size={14} color="var(--label-3)" />
            <input
              className="master-search-input"
              placeholder="Cari nama, NIK, departemen…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && <button className="master-clear" onClick={() => setQuery('')}>✕</button>}
          </div>
          <div className="master-filter-tabs">
            <button
              className={`master-tab ${filterSesi === 'Semua' ? 'master-tab-active' : ''}`}
              onClick={() => setFilterSesi('Semua')}
            >Semua</button>
            {sessions.map(s => {
              const cfg = SPORT_CFG[s.category] || {}
              const active = filterSesi === s.evNum
              return (
                <button
                  key={s.evNum}
                  className={`master-tab ${active ? 'master-tab-active' : ''}`}
                  style={active ? { background: cfg.color, borderColor: cfg.color, color: '#fff' } : {}}
                  onClick={() => setFilterSesi(s.evNum)}
                >
                  {cfg.emoji} Sesi {s.evNum}
                </button>
              )
            })}
          </div>
        </div>

        <div className="master-info-row">
          Menampilkan <strong>{filteredMaster.length}</strong> dari {masterList.length} peserta
        </div>

        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: 'center' }}>#</th>
                <th>Nama Peserta</th>
                <th>NIK</th>
                <th>Departemen</th>
                {sessions.map(s => {
                  const cfg = SPORT_CFG[s.category] || {}
                  return (
                    <th key={s.evNum} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {cfg.emoji} Sesi {s.evNum}<br />
                      <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--label-4)' }}>
                        {s.category}
                      </span>
                    </th>
                  )
                })}
                <th style={{ textAlign: 'center' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaster.map((p, i) => {
                const total = Object.keys(p.sessions).length
                return (
                  <tr key={i} className={p.isResign ? 'master-row-resign' : ''}>
                    <td className="master-td-no">{i + 1}</td>
                    <td className="master-td-name">
                      {p.isResign && <span className="master-resign-dot" />}
                      <span style={{ textDecoration: p.isResign ? 'line-through' : 'none' }}>
                        {p.name}
                      </span>
                      {p.isResign && <span className="master-resign-badge">Resign</span>}
                    </td>
                    <td className="master-td-nik">{p.nik || <span className="master-empty">—</span>}</td>
                    <td>
                      {p.entity
                        ? <span className="master-entity">{p.entity}</span>
                        : <span className="master-empty">—</span>}
                    </td>
                    {sessions.map(s => {
                      const cfg     = SPORT_CFG[s.category] || { light:'#F2F2F7', color:'#8E8E93', border:'#E5E5EA' }
                      const attended = p.sessions[s.evNum]
                      return (
                        <td key={s.evNum} style={{ textAlign: 'center' }}>
                          {attended
                            ? <span className="master-sport-badge" style={{ background: cfg.light, color: cfg.color, border: `1px solid ${cfg.border}` }}>✓</span>
                            : <span className="master-sport-none">—</span>}
                        </td>
                      )
                    })}
                    <td style={{ textAlign: 'center' }}>
                      <span className="master-total-badge" style={{
                        background: total >= 4 ? '#5856D6' : total >= 2 ? '#007AFF' : '#8E8E93'
                      }}>{total}</span>
                    </td>
                  </tr>
                )
              })}
              {filteredMaster.length === 0 && (
                <tr><td colSpan={5 + sessions.length} className="master-empty-row">Tidak ada data yang cocok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
