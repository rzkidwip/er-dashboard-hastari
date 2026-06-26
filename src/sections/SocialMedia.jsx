import { useMemo, useState } from 'react'
import {
  ExternalLink, Eye, TrendingUp, Film, Grid,
  FileText, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Users, Smartphone, Search, Calendar, AtSign,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import './SocialMedia.css'

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  {
    name:    'Life at Hastari',
    handle:  '@lifeathastari',
    primary: '#7C3AED',
    light:   '#A855F7',
    bg:      '#F5F3FF',
    border:  '#DDD6FE',
    grad:    'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
  },
  {
    name:    'Hastari Jaya Sentosa',
    handle:  '@hastarijayasentosa',
    primary: '#3B82F6',
    light:   '#60A5FA',
    bg:      '#EFF6FF',
    border:  '#BFDBFE',
    grad:    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  },
]

const TYPE_CFG = {
  Reels:    { color: '#7C3AED', bg: '#F5F3FF', icon: Film     },
  Carousel: { color: '#3B82F6', bg: '#EFF6FF', icon: Grid     },
  Post:     { color: '#6B7280', bg: '#F3F4F6', icon: FileText },
}

const TYPE_COLORS = { Reels: '#7C3AED', Carousel: '#3B82F6', Post: '#6B7280' }

const MONTHS_ID  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des']
const HEATMAP_WEEKS = 16
const CI_PAGE_SIZE  = 12

const GROWTH_LINES = [
  { key: 'reach',      label: 'Reach',      color: '#3B82F6' },
  { key: 'views',      label: 'Views',      color: '#10B981' },
  { key: 'engagement', label: 'Engagement', color: '#F59E0B' },
]

const CI_COLS = [
  { key: 'postType',       label: 'Tipe',    sortable: true  },
  { key: 'postDate',       label: 'Tanggal', sortable: true  },
  { key: 'caption',        label: 'Caption', sortable: false },
  { key: 'reach',          label: 'Reach',   sortable: true  },
  { key: 'views',          label: 'Views',   sortable: true  },
  { key: 'likes',          label: 'Likes',   sortable: true  },
  { key: 'shares',         label: 'Shares',  sortable: true  },
  { key: 'engagementRate', label: 'ER%',     sortable: true  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normType = t => {
  if (!t) return 'Post'
  const l = t.toLowerCase()
  if (l.includes('reel')) return 'Reels'
  if (l.includes('car'))  return 'Carousel'
  return 'Post'
}

const fmtDate = d => {
  if (!d) return '—'
  const parts = d.split('/')
  if (parts.length < 3) return d
  const [dd, mm, yy] = parts
  const yr = yy.length === 2 ? '20' + yy : yy
  return `${parseInt(dd, 10)} ${MONTHS_ID[parseInt(mm, 10) - 1] ?? ''} ${yr}`
}

const dateToMs = d => {
  if (!d) return 0
  const [dd, mm, yy] = (d || '').split('/')
  if (!dd || !mm || !yy) return 0
  const yr = yy.length === 2 ? '20' + yy : yy
  return new Date(Number(yr), Number(mm) - 1, Number(dd)).getTime() || 0
}

const fmtNum = n => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString('id-ID')
}
const fmtFull = n => Number(n).toLocaleString('id-ID')

const calcER = a => {
  const r = Number(a.reach) || 0
  if (!r) return 0
  return ((Number(a.likes) + Number(a.shares)) / r) * 100
}

const getAccCfg = name => ACCOUNTS.find(a => a.name === name) ?? ACCOUNTS[0]

const erBadgeStyle = er => ({
  background: er >= 5 ? '#DCFCE7' : er >= 2 ? '#FEF9C3' : '#FEE2E2',
  color:      er >= 5 ? '#166534' : er >= 2 ? '#713F12' : '#991B1B',
})

// ─── Account Tab Bar ──────────────────────────────────────────────────────────

function AccountTabBar({ selected, onChange }) {
  return (
    <div className="sm3-acc-tabs" role="tablist">
      {ACCOUNTS.map(acc => (
        <button
          key={acc.name}
          role="tab"
          aria-selected={selected === acc.name}
          className={`sm3-acc-tab ${selected === acc.name ? 'active' : ''}`}
          style={selected === acc.name ? { '--c': acc.primary } : {}}
          onClick={() => onChange(acc.name)}
        >
          <span className="sm3-acc-dot" style={{ background: acc.primary }} />
          {acc.handle}
        </button>
      ))}
    </div>
  )
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function trendForField(analytics, field) {
  const now = new Date()
  const cy = now.getFullYear(), cm = now.getMonth()
  let cur = 0, prev = 0
  analytics.forEach(a => {
    const ms = dateToMs(a.postDate)
    if (!ms) return
    const d = new Date(ms)
    const val = field === 'count' ? 1 : (Number(a[field]) || 0)
    if (d.getFullYear() === cy && d.getMonth() === cm) {
      cur += val
    } else if (
      (cm > 0  && d.getFullYear() === cy     && d.getMonth() === cm - 1) ||
      (cm === 0 && d.getFullYear() === cy - 1 && d.getMonth() === 11)
    ) {
      prev += val
    }
  })
  return { cur, prev, pct: prev > 0 ? ((cur - prev) / prev) * 100 : null }
}

function KPICard({ icon: Icon, label, value, pct, color }) {
  const up = pct !== null && pct >= 0
  return (
    <div className="sm3-kpi" style={{ '--kc': color }}>
      <div className="sm3-kpi-top">
        <div className="sm3-kpi-icon-wrap"><Icon size={18} color={color} /></div>
        {pct !== null && (
          <span className={`sm3-kpi-trend ${up ? 'up' : 'dn'}`}>
            {up ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="sm3-kpi-val" style={{ color }}>{value}</div>
      <div className="sm3-kpi-lbl">{label}</div>
      {pct !== null && (
        <div className="sm3-kpi-sub">{up ? '+' : ''}{pct.toFixed(1)}% this month</div>
      )}
    </div>
  )
}

function KPICards({ analytics, summary, accCfg }) {
  const postT  = useMemo(() => trendForField(analytics, 'count'), [analytics])
  const reachT = useMemo(() => trendForField(analytics, 'reach'), [analytics])
  const viewsT = useMemo(() => trendForField(analytics, 'views'), [analytics])

  const followers = useMemo(() => {
    const s = summary?.find(s => s.account === accCfg.name)
    return s ? Number((s.totalFollowers || '0').toString().replace(/,/g, '')) : null
  }, [summary, accCfg])

  const totalReach = analytics.reduce((s, a) => s + (Number(a.reach) || 0), 0)
  const totalViews = analytics.reduce((s, a) => s + (Number(a.views) || 0), 0)

  return (
    <div className="sm3-kpi-row">
      <KPICard icon={Smartphone} label="Total Posts"  value={analytics.length}                     pct={postT.pct}  color={accCfg.primary} />
      <KPICard icon={Users}      label="Followers"    value={followers ? fmtNum(followers) : '—'}  pct={null}       color="#10B981" />
      <KPICard icon={TrendingUp} label="Total Reach"  value={fmtNum(totalReach)}                   pct={reachT.pct} color="#7C3AED" />
      <KPICard icon={Eye}        label="Total Views"  value={fmtNum(totalViews)}                   pct={viewsT.pct} color="#3B82F6" />
    </div>
  )
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function HeatmapSection({ analytics }) {
  const today = useMemo(() => new Date(), [])
  const [tooltip, setTooltip] = useState(null)

  const dayMap = useMemo(() => {
    const map = {}
    const cutoff = new Date(today)
    cutoff.setDate(today.getDate() - HEATMAP_WEEKS * 7)
    analytics.forEach(a => {
      const ms = dateToMs(a.postDate)
      if (!ms || ms < cutoff.getTime()) return
      const d   = new Date(ms)
      const key = d.toISOString().slice(0, 10)
      if (!map[key]) map[key] = { count: 0, reach: 0 }
      map[key].count++
      map[key].reach += Number(a.reach) || 0
    })
    return map
  }, [analytics, today])

  const maxReach = useMemo(() =>
    Math.max(1, ...Object.values(dayMap).map(v => v.reach)),
  [dayMap])

  const cells = useMemo(() => {
    const result = []
    const startDay = new Date(today)
    const dow = startDay.getDay()
    const daysBack = ((dow === 0 ? 7 : dow) - 1) + (HEATMAP_WEEKS - 1) * 7
    startDay.setDate(today.getDate() - daysBack)
    for (let w = 0; w < HEATMAP_WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDay)
        date.setDate(startDay.getDate() + w * 7 + d)
        const key  = date.toISOString().slice(0, 10)
        result.push({ date, key, info: dayMap[key] || null, col: w, row: d })
      }
    }
    return result
  }, [today, dayMap])

  const weekLabels = useMemo(() =>
    Array.from({ length: HEATMAP_WEEKS }, (_, w) => {
      const cell = cells[w * 7]
      return cell && cell.date.getDate() <= 7 ? MONTHS_ID[cell.date.getMonth()] : ''
    }),
  [cells])

  const heatColor = reach => {
    const r = reach / maxReach
    if (r === 0)    return '#F3F4F6'
    if (r < 0.25)   return '#DDD6FE'
    if (r < 0.5)    return '#A78BFA'
    if (r < 0.75)   return '#7C3AED'
    return '#5B21B6'
  }

  return (
    <div className="sm3-card sm3-card--overflow">
      <h3 className="sm3-card-title">Audience Activity</h3>
      <div className="sm3-hm-wrap">
        <div className="sm3-hm-week-labels">
          {weekLabels.map((lbl, i) => <span key={i} className="sm3-hm-mlbl">{lbl}</span>)}
        </div>
        <div className="sm3-hm-body">
          <div className="sm3-hm-day-labels">
            {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => (
              <span key={d} className="sm3-hm-dlbl">{d}</span>
            ))}
          </div>
          <div
            className="sm3-hm-grid"
            style={{ '--cols': HEATMAP_WEEKS }}
            onMouseLeave={() => setTooltip(null)}
          >
            {cells.map(cell => (
              <div
                key={cell.key}
                className="sm3-hm-cell"
                style={{
                  background:  heatColor(cell.info?.reach ?? 0),
                  gridColumn:  cell.col + 1,
                  gridRow:     cell.row + 1,
                  opacity:     cell.date > today ? 0.25 : 1,
                }}
                onMouseEnter={e => cell.info && setTooltip({
                  x: e.clientX, y: e.clientY,
                  date: cell.key, count: cell.info.count, reach: cell.info.reach,
                })}
              />
            ))}
          </div>
        </div>
        <div className="sm3-hm-legend">
          <span className="sm3-hm-legend-lbl">Less</span>
          {['#F3F4F6','#DDD6FE','#A78BFA','#7C3AED','#5B21B6'].map(c => (
            <div key={c} className="sm3-hm-legend-cell" style={{ background: c }} />
          ))}
          <span className="sm3-hm-legend-lbl">More</span>
        </div>
      </div>
      {tooltip && (
        <div className="sm3-hm-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}>
          <strong>{tooltip.date}</strong>
          <span>{tooltip.count} post{tooltip.count !== 1 ? 's' : ''}</span>
          <span>Reach: {fmtFull(tooltip.reach)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Growth Chart ─────────────────────────────────────────────────────────────

function GrowthChart({ analytics }) {
  const [active, setActive] = useState(GROWTH_LINES.map(l => l.key))

  const chartData = useMemo(() => {
    const byMonth = {}
    analytics.forEach(a => {
      const ms = dateToMs(a.postDate)
      if (!ms) return
      const d   = new Date(ms)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const lbl = `${MONTHS_ID[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
      if (!byMonth[key]) byMonth[key] = { month: key, label: lbl, reach: 0, views: 0, engagement: 0 }
      byMonth[key].reach      += Number(a.reach)  || 0
      byMonth[key].views      += Number(a.views)  || 0
      byMonth[key].engagement += (Number(a.likes) || 0) + (Number(a.shares) || 0)
    })
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
  }, [analytics])

  const toggle = key => setActive(prev =>
    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
  )

  return (
    <div className="sm3-card">
      <div className="sm3-card-head">
        <h3 className="sm3-card-title">Account Growth</h3>
        <div className="sm3-legend-row">
          {GROWTH_LINES.map(l => (
            <button
              key={l.key}
              className={`sm3-legend-btn ${active.includes(l.key) ? 'on' : ''}`}
              onClick={() => toggle(l.key)}
            >
              <span className="sm3-legend-dot" style={{ background: active.includes(l.key) ? l.color : '#D1D5DB' }} />
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ left: 0, right: 12, bottom: 24, top: 8 }}>
          <defs>
            {GROWTH_LINES.map(l => (
              <linearGradient key={l.key} id={`smgrad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={l.color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={l.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-25} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} width={50} tickFormatter={v => fmtNum(v)} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }}
            formatter={(v, name) => [fmtFull(v), GROWTH_LINES.find(l => l.key === name)?.label ?? name]}
          />
          {GROWTH_LINES.map(l => active.includes(l.key) && (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2.5}
              fill={`url(#smgrad-${l.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              animationDuration={500}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Content Insights ─────────────────────────────────────────────────────────

function mergePostsAnalytics(posts, analytics) {
  const anaMap = {}
  analytics.forEach(a => {
    const k = `${a.postDate}|${normType(a.postType)}`
    if (!anaMap[k]) anaMap[k] = a
  })
  const source = posts.length > 0 ? posts : analytics
  return source.map(p => {
    const k      = `${p.postDate}|${normType(p.postType)}`
    const a      = anaMap[k] || {}
    const reach  = Number(a.reach  ?? p.reach  ?? 0)
    const views  = Number(a.views  ?? p.views  ?? 0)
    const likes  = Number(a.likes  ?? p.likes  ?? 0)
    const shares = Number(a.shares ?? p.shares ?? 0)
    return {
      ...p,
      _type: normType(p.postType),
      _ms:   dateToMs(p.postDate),
      reach, views, likes, shares,
      engagementRate: reach > 0 ? ((likes + shares) / reach) * 100 : 0,
      link: a.link || p.contentLink || p.link || '',
    }
  })
}

function ContentInsights({ posts, analytics, filterDate, onClearDate }) {
  const [types,   setTypes]   = useState([])
  const [search,  setSearch]  = useState('')
  const [sortCol, setSortCol] = useState('postDate')
  const [sortDir, setSortDir] = useState('desc')
  const [page,    setPage]    = useState(0)

  const merged = useMemo(() => mergePostsAnalytics(posts, analytics), [posts, analytics])

  const filtered = useMemo(() => {
    let list = merged
    if (types.length)    list = list.filter(p => types.includes(p._type))
    if (search.trim())   list = list.filter(p => p.caption?.toLowerCase().includes(search.toLowerCase()))
    if (filterDate)      list = list.filter(p => {
      if (!p._ms) return false
      const d = new Date(p._ms)
      return d.getDate() === filterDate.day && d.getMonth() === filterDate.month && d.getFullYear() === filterDate.year
    })
    return [...list].sort((a, b) => {
      let va, vb
      if      (sortCol === 'postDate')       { va = a._ms;            vb = b._ms            }
      else if (sortCol === 'engagementRate') { va = a.engagementRate; vb = b.engagementRate }
      else if (sortCol === 'postType')       { va = a._type;          vb = b._type          }
      else { va = Number(a[sortCol]) || 0; vb = Number(b[sortCol]) || 0 }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase() }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [merged, types, search, filterDate, sortCol, sortDir])

  const totalPages = Math.ceil(filtered.length / CI_PAGE_SIZE)
  const pageRows   = filtered.slice(page * CI_PAGE_SIZE, (page + 1) * CI_PAGE_SIZE)

  const doSort = col => {
    if (!CI_COLS.find(c => c.key === col)?.sortable) return
    setSortDir(prev => sortCol === col && prev === 'asc' ? 'desc' : 'asc')
    setSortCol(col)
    setPage(0)
  }

  const toggleType = t => { setTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]); setPage(0) }

  return (
    <div className="sm3-card sm3-card--flush">
      <div className="sm3-ci-head">
        <h3 className="sm3-card-title">Content Insights</h3>
        <div className="sm3-ci-controls">
          <div className="sm3-search-wrap">
            <Search size={13} className="sm3-search-icon" />
            <input
              className="sm3-search"
              placeholder="Cari caption…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
          </div>
          <div className="sm3-pills">
            {['Reels','Carousel','Post'].map(t => {
              const on = types.includes(t)
              const cfg = TYPE_CFG[t]
              return (
                <button
                  key={t}
                  className={`sm3-pill ${on ? 'on' : ''}`}
                  style={on ? { background: cfg.color, borderColor: cfg.color, color: '#fff' } : {}}
                  onClick={() => toggleType(t)}
                >
                  {t}
                </button>
              )
            })}
            {types.length > 0 && (
              <button className="sm3-pill-clear" onClick={() => { setTypes([]); setPage(0) }}>✕</button>
            )}
          </div>
        </div>
      </div>

      {filterDate && (
        <div className="sm3-date-banner">
          <Calendar size={12} />
          Filter: {filterDate.day} {MONTHS_ID[filterDate.month]} {filterDate.year}
          <button className="sm3-date-clear" onClick={onClearDate}>✕ Hapus</button>
        </div>
      )}

      <div className="sm3-table-scroll">
        <table className="sm3-table">
          <thead>
            <tr>
              {CI_COLS.map(col => (
                <th
                  key={col.key}
                  className={`sm3-th ${col.sortable ? 'sortable' : ''} ${sortCol === col.key ? 'sorted' : ''}`}
                  onClick={() => doSort(col.key)}
                >
                  <span className="sm3-th-inner">
                    {col.label}
                    {col.sortable && (
                      sortCol === col.key
                        ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
                        : <span className="sm3-sort-n">↕</span>
                    )}
                  </span>
                </th>
              ))}
              <th className="sm3-th">Link</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const tCfg = TYPE_CFG[row._type] ?? TYPE_CFG.Post
              const Icon = tCfg.icon
              const bs   = erBadgeStyle(row.engagementRate)
              return (
                <tr key={i} className="sm3-tr">
                  <td className="sm3-td">
                    <span className="sm3-type-badge" style={{ color: tCfg.color, background: tCfg.bg }}>
                      <Icon size={10} /> {row._type}
                    </span>
                  </td>
                  <td className="sm3-td sm3-td--date">{fmtDate(row.postDate)}</td>
                  <td className="sm3-td sm3-td--caption" title={row.caption || ''}>
                    {row.caption
                      ? (row.caption.length > 60 ? row.caption.slice(0, 60) + '…' : row.caption)
                      : <em className="sm3-muted">—</em>}
                  </td>
                  <td className="sm3-td sm3-td--num">{fmtFull(row.reach)}</td>
                  <td className="sm3-td sm3-td--num">{fmtFull(row.views)}</td>
                  <td className="sm3-td sm3-td--num">{fmtFull(row.likes)}</td>
                  <td className="sm3-td sm3-td--num">{fmtFull(row.shares)}</td>
                  <td className="sm3-td sm3-td--num">
                    <span className="sm3-er-badge" style={bs}>{row.engagementRate.toFixed(1)}%</span>
                  </td>
                  <td className="sm3-td">
                    {row.link && (
                      <a href={row.link} target="_blank" rel="noreferrer" className="sm3-link-btn" aria-label="View post">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr><td colSpan={9} className="sm3-td sm3-td--empty">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="sm3-pagination">
          <button className="sm3-page-btn" onClick={() => setPage(0)} disabled={page === 0}>«</button>
          <button className="sm3-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹</button>
          <span className="sm3-page-info">
            {page * CI_PAGE_SIZE + 1}–{Math.min((page + 1) * CI_PAGE_SIZE, filtered.length)} / {filtered.length}
          </span>
          <button className="sm3-page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>›</button>
          <button className="sm3-page-btn" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
        </div>
      )}
    </div>
  )
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({ posts, selectedDate, onDateSelect }) {
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const postMap = useMemo(() => {
    const map = {}
    posts.forEach(p => {
      const ms = dateToMs(p.postDate)
      if (!ms) return
      const d = new Date(ms)
      if (d.getFullYear() !== view.year || d.getMonth() !== view.month) return
      const day = d.getDate()
      if (!map[day]) map[day] = []
      map[day].push(normType(p.postType))
    })
    return map
  }, [posts, view])

  const firstDow    = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const blanks      = firstDow === 0 ? 6 : firstDow - 1

  const prev = () => setView(v => v.month === 0  ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 })
  const next = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0  } : { year: v.year, month: v.month + 1 })

  const isToday = d => d === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear()
  const isSel   = d => selectedDate?.day === d && selectedDate?.month === view.month && selectedDate?.year === view.year

  return (
    <div className="sm3-card sm3-cal">
      <div className="sm3-cal-head">
        <button className="sm3-cal-nav" onClick={prev}><ChevronLeft size={14} /></button>
        <span className="sm3-cal-title">{MONTHS_ID[view.month]} {view.year}</span>
        <button className="sm3-cal-nav" onClick={next}><ChevronRight size={14} /></button>
      </div>
      <div className="sm3-cal-grid">
        {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => (
          <div key={d} className="sm3-cal-dow">{d}</div>
        ))}
        {Array.from({ length: blanks }, (_, i) => <div key={`b${i}`} className="sm3-cal-blank" />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d     = i + 1
          const types = postMap[d] ? [...new Set(postMap[d])] : []
          return (
            <div
              key={d}
              className={`sm3-cal-cell ${isToday(d) ? 'today' : ''} ${isSel(d) ? 'sel' : ''} ${types.length ? 'has-post' : ''}`}
              onClick={() => types.length && (isSel(d) ? onDateSelect(null) : onDateSelect({ day: d, month: view.month, year: view.year }))}
              title={types.length ? `${postMap[d].length} post${postMap[d].length > 1 ? 's' : ''}` : ''}
            >
              <span className="sm3-cal-num">{d}</span>
              {types.length > 0 && (
                <div className="sm3-cal-dots">
                  {types.slice(0, 3).map(t => (
                    <span key={t} className="sm3-cal-dot" style={{ background: TYPE_COLORS[t] }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Recent Activities ────────────────────────────────────────────────────────

function RecentActivities({ posts, analytics }) {
  const recent = useMemo(() => {
    const rows = mergePostsAnalytics(posts, analytics)
    return rows.sort((a, b) => b._ms - a._ms).slice(0, 5)
  }, [posts, analytics])

  return (
    <div className="sm3-card">
      <h3 className="sm3-card-title">Recent Activities</h3>
      <div className="sm3-activities">
        {recent.map((p, i) => {
          const tCfg = TYPE_CFG[p._type] ?? TYPE_CFG.Post
          const Icon = tCfg.icon
          return (
            <div key={i} className="sm3-activity" style={{ '--acolor': TYPE_COLORS[p._type] }}>
              <div className="sm3-activity-icon" style={{ background: tCfg.bg }}>
                <Icon size={13} color={tCfg.color} />
              </div>
              <div className="sm3-activity-body">
                <div className="sm3-activity-meta">
                  <span className="sm3-activity-type" style={{ color: tCfg.color }}>{p._type}</span>
                  <span className="sm3-activity-date">{fmtDate(p.postDate)}</span>
                </div>
                <p className="sm3-activity-caption">
                  {p.caption
                    ? (p.caption.length > 80 ? p.caption.slice(0, 80) + '…' : p.caption)
                    : `${p._type} · ${fmtDate(p.postDate)}`}
                </p>
                <div className="sm3-activity-metrics">
                  <span><TrendingUp size={10} /> {fmtNum(p.reach)}</span>
                  <span><Eye size={10} /> {fmtNum(p.views)}</span>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer" className="sm3-activity-link">
                      View <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {recent.length === 0 && <p className="sm3-muted">Tidak ada aktivitas</p>}
      </div>
    </div>
  )
}

// ─── Top Performing Posts ─────────────────────────────────────────────────────

function TopPosts({ analytics }) {
  const top3 = useMemo(() =>
    [...analytics]
      .map(a => ({ ...a, _er: calcER(a), _type: normType(a.postType) }))
      .sort((a, b) => b._er - a._er)
      .slice(0, 3),
  [analytics])

  const statusFor = er =>
    er >= 5 ? { lbl: '🔥 Hot',  color: '#DC2626' } :
    er >= 2 ? { lbl: '✓ Good', color: '#059669' } :
              { lbl: '— Low',  color: '#9CA3AF' }

  return (
    <div className="sm3-card">
      <h3 className="sm3-card-title">Top Performing Posts</h3>
      <table className="sm3-top-table">
        <thead>
          <tr>
            <th>Type</th><th>Tanggal</th><th>ER%</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {top3.map((a, i) => {
            const tCfg = TYPE_CFG[a._type] ?? TYPE_CFG.Post
            const Icon = tCfg.icon
            const st   = statusFor(a._er)
            return (
              <tr key={i} className="sm3-top-tr">
                <td>
                  <span className="sm3-type-badge" style={{ color: tCfg.color, background: tCfg.bg }}>
                    <Icon size={10} /> {a._type}
                  </span>
                </td>
                <td className="sm3-td--date">{fmtDate(a.postDate)}</td>
                <td className="sm3-td--num sm3-er-bold">{a._er.toFixed(1)}%</td>
                <td style={{ color: st.color, fontWeight: 600, fontSize: 12 }}>{st.lbl}</td>
              </tr>
            )
          })}
          {top3.length === 0 && (
            <tr><td colSpan={4} className="sm3-td--empty">Tidak ada data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function SocialMedia({ data }) {
  const [account,    setAccount]    = useState(ACCOUNTS[0].name)
  const [filterDate, setFilterDate] = useState(null)

  const posts     = data?.posts     ?? []
  const analytics = data?.analytics ?? []
  const summary   = data?.summary   ?? []

  const accCfg   = getAccCfg(account)
  const accPosts = useMemo(() => posts.filter(p => p.account === account),     [posts,     account])
  const accAna   = useMemo(() => analytics.filter(a => a.account === account), [analytics, account])

  const calPosts = useMemo(() =>
    (accPosts.length > 0 ? accPosts : accAna),
  [accPosts, accAna])

  if (!analytics.length && !posts.length) {
    return (
      <div className="sm3-empty-state">
        <AtSign size={40} style={{ opacity: 0.25 }} />
        <p>Memuat data social media…</p>
      </div>
    )
  }

  return (
    <div className="sm3-page">
      <div className="sm3-page-head">
        <h1 className="page-title">Social Media Dashboard</h1>
      </div>

      <AccountTabBar
        selected={account}
        onChange={acc => { setAccount(acc); setFilterDate(null) }}
      />

      <div className="sm3-layout">
        {/* Left 65% */}
        <div className="sm3-left">
          <KPICards analytics={accAna} summary={summary} accCfg={accCfg} />
          <HeatmapSection analytics={accAna} />
          <GrowthChart analytics={accAna} />
          <ContentInsights
            posts={accPosts}
            analytics={accAna}
            filterDate={filterDate}
            onClearDate={() => setFilterDate(null)}
          />
        </div>

        {/* Right 35% */}
        <div className="sm3-right">
          <MiniCalendar
            posts={calPosts}
            selectedDate={filterDate}
            onDateSelect={setFilterDate}
          />
          <RecentActivities posts={accPosts} analytics={accAna} />
          <TopPosts analytics={accAna} />
        </div>
      </div>
    </div>
  )
}
