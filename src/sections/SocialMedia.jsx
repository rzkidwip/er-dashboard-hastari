import { useMemo, useState } from 'react'
import {
  ExternalLink, Eye, Heart, Share2, TrendingUp, Film, Grid,
  FileText, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Award, Zap, AtSign, Calendar,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import './SocialMedia.css'

// ─── Config ─────────────────────────────────────────────────────────────────

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
  Reels:    { color: '#7C3AED', bg: '#F5F3FF', icon: Film },
  Carousel: { color: '#3B82F6', bg: '#EFF6FF', icon: Grid },
  Post:     { color: '#6B7280', bg: '#F3F4F6', icon: FileText },
}

const CHART_METRICS = [
  { value: 'reach',  label: 'Reach',  color: '#7C3AED' },
  { value: 'views',  label: 'Views',  color: '#3B82F6' },
  { value: 'likes',  label: 'Likes',  color: '#EF4444' },
  { value: 'shares', label: 'Shares', color: '#10B981' },
]

const TABLE_COLS = [
  { key: 'postDate',       label: 'Tanggal', align: 'left'  },
  { key: 'postType',       label: 'Tipe',    align: 'left'  },
  { key: 'reach',          label: 'Reach',   align: 'right' },
  { key: 'views',          label: 'Views',   align: 'right' },
  { key: 'likes',          label: 'Likes',   align: 'right' },
  { key: 'shares',         label: 'Shares',  align: 'right' },
  { key: 'engagementRate', label: 'ER %',    align: 'right' },
]

const PAGE_SIZE = 10

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des']
  const yr = yy.length === 2 ? '20' + yy : yy
  return `${parseInt(dd, 10)} ${months[parseInt(mm, 10) - 1] ?? ''} ${yr}`
}

const dateToMs = d => {
  if (!d) return 0
  const [dd, mm, yy] = d.split('/')
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

// ─── Shared: Account Tab Bar ─────────────────────────────────────────────────

function AccountTabBar({ selected, onChange }) {
  return (
    <div className="sm2-acc-tabs" role="tablist" aria-label="Account selector">
      {ACCOUNTS.map(acc => (
        <button
          key={acc.name}
          role="tab"
          aria-selected={selected === acc.name}
          className={`sm2-acc-tab ${selected === acc.name ? 'active' : ''}`}
          style={selected === acc.name ? { '--c': acc.primary } : {}}
          onClick={() => onChange(acc.name)}
        >
          <span className="sm2-acc-dot" style={{ background: acc.primary }} aria-hidden="true" />
          {acc.handle}
        </button>
      ))}
    </div>
  )
}

// ─── SECTION 1: CONTENT PLANNER ──────────────────────────────────────────────

function HeroCard({ accCfg, analytics }) {
  const totals = useMemo(() =>
    analytics.reduce((t, a) => ({
      reach:  t.reach  + (Number(a.reach)  || 0),
      views:  t.views  + (Number(a.views)  || 0),
      likes:  t.likes  + (Number(a.likes)  || 0),
      shares: t.shares + (Number(a.shares) || 0),
    }), { reach: 0, views: 0, likes: 0, shares: 0 }),
  [analytics])

  const latest = useMemo(() =>
    [...analytics].sort((a, b) => dateToMs(b.postDate) - dateToMs(a.postDate))[0],
  [analytics])

  const avgReach = analytics.length ? Math.round(totals.reach / analytics.length) : 0

  const metrics = [
    { label: 'Total Reach',  val: fmtNum(totals.reach),  icon: TrendingUp, color: accCfg.primary },
    { label: 'Total Views',  val: fmtNum(totals.views),  icon: Eye,        color: '#6366F1'       },
    { label: 'Total Likes',  val: fmtNum(totals.likes),  icon: Heart,      color: '#EF4444'       },
    { label: 'Total Shares', val: fmtNum(totals.shares), icon: Share2,     color: '#10B981'       },
  ]

  return (
    <div className="sm2-hero">
      <div className="sm2-hero-header" style={{ background: accCfg.grad }}>
        <div className="sm2-hero-identity">
          <div className="sm2-hero-avatar" aria-hidden="true">
            <AtSign size={22} color="white" />
          </div>
          <div>
            <div className="sm2-hero-name">{accCfg.name}</div>
            <div className="sm2-hero-handle">{accCfg.handle} · Instagram</div>
          </div>
        </div>
        <div className="sm2-hero-counters">
          <div className="sm2-hero-counter">
            <div className="sm2-hero-counter-val">{analytics.length}</div>
            <div className="sm2-hero-counter-lbl">Total Posts</div>
          </div>
          <div className="sm2-hero-counter">
            <div className="sm2-hero-counter-val">{fmtNum(avgReach)}</div>
            <div className="sm2-hero-counter-lbl">Avg Reach</div>
          </div>
        </div>
      </div>

      <div className="sm2-hero-metrics">
        {metrics.map(m => (
          <div key={m.label} className="sm2-hero-metric">
            <div className="sm2-hero-metric-icon" style={{ background: m.color + '18' }} aria-hidden="true">
              <m.icon size={14} color={m.color} />
            </div>
            <div className="sm2-hero-metric-val" style={{ color: m.color }}>{m.val}</div>
            <div className="sm2-hero-metric-lbl">{m.label}</div>
          </div>
        ))}
      </div>

      {latest && (
        <div className="sm2-hero-latest" style={{ borderColor: accCfg.border }}>
          <Calendar size={11} color={accCfg.primary} aria-hidden="true" />
          <span className="sm2-hero-latest-tag" style={{ color: accCfg.primary }}>Post Terbaru</span>
          <span className="sm2-hero-latest-info">
            {fmtDate(latest.postDate)} · {normType(latest.postType)}
          </span>
          <span className="sm2-hero-latest-reach" style={{ color: accCfg.primary }}>
            {fmtNum(Number(latest.reach) || 0)} reach
          </span>
          {latest.link && (
            <a href={latest.link} target="_blank" rel="noreferrer"
               className="sm2-hero-latest-link" style={{ color: accCfg.primary }}
               aria-label="View latest post">
              <ExternalLink size={11} aria-hidden="true" /> Lihat
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, accCfg }) {
  const type    = normType(post.postType)
  const typeCfg = TYPE_CFG[type] ?? TYPE_CFG.Post
  const Icon    = typeCfg.icon
  const er      = calcER(post)

  return (
    <article className="sm2-post-card" style={{ '--acc': accCfg.primary }}>
      <div className="sm2-post-card-band" style={{ background: accCfg.grad }} />

      <div className="sm2-post-card-inner">
        <div className="sm2-post-card-head">
          <span className="sm2-type-badge" style={{ color: typeCfg.color, background: typeCfg.bg }}>
            <Icon size={10} aria-hidden="true" /> {type}
          </span>
          <span className="sm2-post-date">
            <Calendar size={10} aria-hidden="true" /> {fmtDate(post.postDate)}
          </span>
        </div>

        {post.caption ? (
          <p className="sm2-post-caption" title={post.caption}>
            {post.caption.length > 110 ? post.caption.slice(0, 110) + '…' : post.caption}
          </p>
        ) : (
          <p className="sm2-post-caption sm2-post-caption--empty">
            {normType(post.postType)} · {fmtDate(post.postDate)}
          </p>
        )}

        <div className="sm2-post-metrics">
          <div className="sm2-post-metric">
            <TrendingUp size={11} color="#7C3AED" aria-hidden="true" />
            <span>{fmtNum(Number(post.reach) || 0)}</span>
            <span className="sm2-post-metric-lbl">Reach</span>
          </div>
          <div className="sm2-post-metric">
            <Eye size={11} color="#6366F1" aria-hidden="true" />
            <span>{fmtNum(Number(post.views) || 0)}</span>
            <span className="sm2-post-metric-lbl">Views</span>
          </div>
          <div className="sm2-post-metric">
            <Heart size={11} color="#EF4444" aria-hidden="true" />
            <span>{fmtNum(Number(post.likes) || 0)}</span>
            <span className="sm2-post-metric-lbl">Likes</span>
          </div>
          <div className="sm2-post-metric">
            <Share2 size={11} color="#10B981" aria-hidden="true" />
            <span>{fmtNum(Number(post.shares) || 0)}</span>
            <span className="sm2-post-metric-lbl">Shares</span>
          </div>
        </div>

        <div className="sm2-post-card-footer">
          <span className="sm2-er-pill"
            style={{
              background: er >= 5 ? '#DCFCE7' : er >= 2 ? '#FEF9C3' : '#FEE2E2',
              color:      er >= 5 ? '#166534' : er >= 2 ? '#713F12' : '#991B1B',
            }}>
            ER {er.toFixed(1)}%
          </span>
          {(post.link || post.contentLink) && (
            <a
              href={post.link || post.contentLink}
              target="_blank"
              rel="noreferrer"
              className="sm2-view-btn"
              style={{ background: accCfg.primary }}
              aria-label="View post on Instagram"
            >
              <ExternalLink size={11} aria-hidden="true" /> View Post
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

const SORT_OPTS = [
  { value: 'date',       label: 'Date (Newest)' },
  { value: 'reach',      label: 'Reach'         },
  { value: 'likes',      label: 'Likes'         },
  { value: 'engagement', label: 'Engagement Rate' },
]

function ContentPlannerSection({ posts, analytics, accCfg }) {
  const [types,  setTypes]  = useState([])
  const [sortBy, setSortBy] = useState('date')

  const toggleType = t =>
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  // Merge posts + analytics by matching date+type for per-card metrics
  const enriched = useMemo(() => {
    const anaMap = {}
    analytics.forEach(a => {
      const k = `${a.postDate}|${normType(a.postType)}`
      if (!anaMap[k]) anaMap[k] = a
    })
    // If no posts data, fall back to analytics
    const source = posts.length > 0 ? posts : analytics
    return source.map(p => {
      const k   = `${p.postDate}|${normType(p.postType)}`
      const ana = anaMap[k] || {}
      return {
        ...p,
        reach:  ana.reach  ?? p.reach  ?? 0,
        views:  ana.views  ?? p.views  ?? 0,
        likes:  ana.likes  ?? p.likes  ?? 0,
        shares: ana.shares ?? p.shares ?? 0,
        link:   ana.link   || p.contentLink || p.link || '',
      }
    })
  }, [posts, analytics])

  const filtered = useMemo(() => {
    let list = enriched
    if (types.length > 0) list = list.filter(p => types.includes(normType(p.postType)))
    return [...list].sort((a, b) => {
      if (sortBy === 'date')       return dateToMs(b.postDate) - dateToMs(a.postDate)
      if (sortBy === 'reach')      return (Number(b.reach) || 0) - (Number(a.reach) || 0)
      if (sortBy === 'likes')      return (Number(b.likes) || 0) - (Number(a.likes) || 0)
      if (sortBy === 'engagement') return calcER(b) - calcER(a)
      return 0
    })
  }, [enriched, types, sortBy])

  return (
    <div className="sm2-section">
      <HeroCard accCfg={accCfg} analytics={analytics} />

      <div className="sm2-filter-bar">
        <div className="sm2-filter-group">
          <span className="sm2-filter-lbl">Post Type</span>
          <div className="sm2-pills">
            {['Reels', 'Carousel', 'Post'].map(t => {
              const active = types.includes(t)
              const cfg = TYPE_CFG[t]
              return (
                <button
                  key={t}
                  className={`sm2-pill ${active ? 'active' : ''}`}
                  style={active ? { background: cfg.color, borderColor: cfg.color, color: '#fff' } : {}}
                  onClick={() => toggleType(t)}
                  aria-pressed={active}
                >
                  {t}
                </button>
              )
            })}
            {types.length > 0 && (
              <button className="sm2-pill-clear" onClick={() => setTypes([])}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="sm2-filter-group">
          <span className="sm2-filter-lbl">Sort by</span>
          <select
            className="sm2-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort posts"
          >
            {SORT_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <span className="sm2-result-count" aria-live="polite">{filtered.length} posts</span>
      </div>

      <div className="sm2-grid">
        {filtered.map((p, i) => (
          <PostCard key={i} post={p} accCfg={accCfg} />
        ))}
        {filtered.length === 0 && (
          <div className="sm2-empty">Tidak ada post yang cocok dengan filter</div>
        )}
      </div>
    </div>
  )
}

// ─── SECTION 2: SOCIAL MEDIA PERFORMANCE ─────────────────────────────────────

function InsightCard({ icon: Icon, label, value, sub, color, link }) {
  return (
    <div className="sm2-insight">
      <div className="sm2-insight-icon" style={{ background: color + '18' }} aria-hidden="true">
        <Icon size={16} color={color} />
      </div>
      <div className="sm2-insight-body">
        <div className="sm2-insight-label">{label}</div>
        <div className="sm2-insight-val" style={{ color }}>{value}</div>
        <div className="sm2-insight-sub">{sub}</div>
      </div>
      {link && (
        <a href={link} target="_blank" rel="noreferrer"
           className="sm2-insight-link" aria-label={`View ${label} post`}>
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  )
}

function SortIcon({ col, tableSort }) {
  if (tableSort.col !== col) return <span className="sm2-sort-neutral" aria-hidden="true">↕</span>
  return tableSort.dir === 'asc'
    ? <ChevronUp   size={12} aria-hidden="true" />
    : <ChevronDown size={12} aria-hidden="true" />
}

function PerformanceSection({ analytics, accCfg }) {
  const [chartMetric, setChartMetric] = useState('reach')
  const [tableSort,   setTableSort]   = useState({ col: 'postDate', dir: 'desc' })
  const [page,        setPage]        = useState(0)

  const parsed = useMemo(() => analytics.map(a => ({
    ...a,
    _reach:  Number(a.reach)  || 0,
    _views:  Number(a.views)  || 0,
    _likes:  Number(a.likes)  || 0,
    _shares: Number(a.shares) || 0,
    _er:     calcER(a),
    _ms:     dateToMs(a.postDate),
    _type:   normType(a.postType),
  })), [analytics])

  // ── KPIs
  const kpis = useMemo(() => {
    const totalReach = parsed.reduce((s, a) => s + a._reach, 0)
    const totalEng   = parsed.reduce((s, a) => s + a._likes + a._shares, 0)
    const byType = {}
    parsed.forEach(a => {
      byType[a._type] = (byType[a._type] || 0) + a._likes + a._shares
    })
    const bestType = Object.entries(byType).sort((x, y) => y[1] - x[1])[0]?.[0] ?? '—'
    return {
      posts:    parsed.length,
      avgReach: parsed.length ? Math.round(totalReach / parsed.length) : 0,
      totalEng,
      bestType,
    }
  }, [parsed])

  // ── Insights
  const top = useMemo(() => ({
    reach:  [...parsed].sort((a, b) => b._reach  - a._reach)[0],
    likes:  [...parsed].sort((a, b) => b._likes  - a._likes)[0],
    er:     [...parsed].sort((a, b) => b._er     - a._er)[0],
    shares: [...parsed].sort((a, b) => b._shares - a._shares)[0],
  }), [parsed])

  // ── Charts
  const metricCfg = CHART_METRICS.find(m => m.value === chartMetric) ?? CHART_METRICS[0]
  const mKey      = `_${chartMetric}`

  const lineData = useMemo(() => {
    const byDate = {}
    ;[...parsed].sort((a, b) => a._ms - b._ms).forEach(a => {
      const d = fmtDate(a.postDate)
      if (!byDate[d]) byDate[d] = { date: d, value: 0 }
      byDate[d].value += a[mKey] || 0
    })
    return Object.values(byDate).slice(-20)
  }, [parsed, mKey])

  const barData = useMemo(() => {
    const byType = {}
    parsed.forEach(a => {
      if (!byType[a._type]) byType[a._type] = { type: a._type, total: 0, count: 0 }
      byType[a._type].total += a[mKey] || 0
      byType[a._type].count++
    })
    return Object.values(byType).map(t => ({
      ...t,
      avg: t.count ? Math.round(t.total / t.count) : 0,
    }))
  }, [parsed, mKey])

  // ── Table
  const sorted = useMemo(() => {
    const { col, dir } = tableSort
    return [...parsed].sort((a, b) => {
      let va, vb
      if      (col === 'postDate')       { va = a._ms;     vb = b._ms     }
      else if (col === 'reach')          { va = a._reach;  vb = b._reach  }
      else if (col === 'views')          { va = a._views;  vb = b._views  }
      else if (col === 'likes')          { va = a._likes;  vb = b._likes  }
      else if (col === 'shares')         { va = a._shares; vb = b._shares }
      else if (col === 'engagementRate') { va = a._er;     vb = b._er     }
      else if (col === 'postType')       { va = a._type;   vb = b._type   }
      else                               { va = String(a[col] ?? ''); vb = String(b[col] ?? '') }
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return dir === 'asc' ? -1 : 1
      if (va > vb) return dir === 'asc' ? 1  : -1
      return 0
    })
  }, [parsed, tableSort])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = col => {
    setTableSort(prev => ({
      col,
      dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
    setPage(0)
  }

  return (
    <div className="sm2-section">
      {/* KPI Row */}
      <div className="sm2-kpi-row">
        <div className="sm2-kpi">
          <div className="sm2-kpi-icon" style={{ background: accCfg.primary + '18' }} aria-hidden="true">
            <FileText size={20} color={accCfg.primary} />
          </div>
          <div className="sm2-kpi-val" style={{ color: accCfg.primary }}>{kpis.posts}</div>
          <div className="sm2-kpi-lbl">Total Posts</div>
        </div>
        <div className="sm2-kpi">
          <div className="sm2-kpi-icon" style={{ background: '#7C3AED18' }} aria-hidden="true">
            <TrendingUp size={20} color="#7C3AED" />
          </div>
          <div className="sm2-kpi-val" style={{ color: '#7C3AED' }}>{fmtNum(kpis.avgReach)}</div>
          <div className="sm2-kpi-lbl">Avg Reach / Post</div>
        </div>
        <div className="sm2-kpi">
          <div className="sm2-kpi-icon" style={{ background: '#EF444418' }} aria-hidden="true">
            <Zap size={20} color="#EF4444" />
          </div>
          <div className="sm2-kpi-val" style={{ color: '#EF4444' }}>{fmtNum(kpis.totalEng)}</div>
          <div className="sm2-kpi-lbl">Total Engagement</div>
        </div>
        <div className="sm2-kpi">
          <div className="sm2-kpi-icon" style={{ background: '#10B98118' }} aria-hidden="true">
            <Award size={20} color="#10B981" />
          </div>
          <div className="sm2-kpi-val" style={{ color: '#10B981', fontSize: 20 }}>{kpis.bestType}</div>
          <div className="sm2-kpi-lbl">Best Post Type</div>
        </div>
      </div>

      {/* Insights */}
      {parsed.length > 0 && (
        <div className="sm2-insights-row">
          {top.reach && (
            <InsightCard icon={TrendingUp} label="Highest Reach" color="#7C3AED"
              value={fmtNum(top.reach._reach)}
              sub={`${fmtDate(top.reach.postDate)} · ${top.reach._type}`}
              link={top.reach.link} />
          )}
          {top.likes && (
            <InsightCard icon={Heart} label="Most Liked" color="#EF4444"
              value={fmtNum(top.likes._likes)}
              sub={`${fmtDate(top.likes.postDate)} · ${top.likes._type}`}
              link={top.likes.link} />
          )}
          {top.er && (
            <InsightCard icon={Zap} label="Best Engagement Rate" color="#F59E0B"
              value={`${top.er._er.toFixed(1)}%`}
              sub={`${fmtDate(top.er.postDate)} · ${top.er._type}`}
              link={top.er.link} />
          )}
          {top.shares && (
            <InsightCard icon={Share2} label="Most Shared" color="#10B981"
              value={fmtNum(top.shares._shares)}
              sub={`${fmtDate(top.shares.postDate)} · ${top.shares._type}`}
              link={top.shares.link} />
          )}
        </div>
      )}

      {/* Charts */}
      {parsed.length > 0 && (
        <div className="sm2-charts-row">
          {/* Line chart */}
          <div className="sm2-chart-card sm2-chart-card--wide">
            <div className="sm2-chart-head">
              <h3 className="sm2-chart-title">
                Trend {metricCfg.label} per Post
              </h3>
              <div className="sm2-metric-pills">
                {CHART_METRICS.map(m => (
                  <button
                    key={m.value}
                    className={`sm2-metric-pill ${chartMetric === m.value ? 'active' : ''}`}
                    style={chartMetric === m.value
                      ? { background: m.color, borderColor: m.color, color: '#fff' }
                      : {}}
                    onClick={() => setChartMetric(m.value)}
                    aria-pressed={chartMetric === m.value}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={lineData} margin={{ left: 4, right: 12, bottom: 24, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  angle={-25} textAnchor="end" height={52}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  width={52}
                  tickFormatter={v => fmtNum(v)}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }}
                  formatter={v => [fmtFull(v), metricCfg.label]}
                />
                <Line
                  type="monotone" dataKey="value"
                  stroke={metricCfg.color} strokeWidth={2.5}
                  dot={{ r: 3, fill: metricCfg.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div className="sm2-chart-card">
            <div className="sm2-chart-head">
              <h3 className="sm2-chart-title">Avg {metricCfg.label} by Type</h3>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barData} margin={{ left: 4, right: 12, bottom: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  width={52}
                  tickFormatter={v => fmtNum(v)}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }}
                  formatter={v => [fmtFull(v), `Avg ${metricCfg.label}`]}
                />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]} animationDuration={500}>
                  {barData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={TYPE_CFG[entry.type]?.color ?? metricCfg.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance Table */}
      <div className="sm2-table-wrap">
        <div className="sm2-table-header">
          <h3 className="sm2-chart-title" style={{ margin: 0 }}>Performance Table</h3>
          <span className="sm2-result-count" aria-live="polite">{sorted.length} posts</span>
        </div>
        <div className="sm2-table-scroll">
          <table className="sm2-table" aria-label="Social media performance data">
            <thead>
              <tr>
                {TABLE_COLS.map(col => (
                  <th
                    key={col.key}
                    className="sm2-th"
                    style={{ textAlign: col.align }}
                    onClick={() => handleSort(col.key)}
                    aria-sort={tableSort.col === col.key
                      ? (tableSort.dir === 'asc' ? 'ascending' : 'descending')
                      : 'none'}
                    scope="col"
                  >
                    <span className="sm2-th-inner">
                      {col.label}
                      <SortIcon col={col.key} tableSort={tableSort} />
                    </span>
                  </th>
                ))}
                <th className="sm2-th" scope="col">Link</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, i) => {
                const tCfg = TYPE_CFG[row._type] ?? TYPE_CFG.Post
                return (
                  <tr key={i} className="sm2-tr">
                    <td className="sm2-td sm2-td--date">{fmtDate(row.postDate)}</td>
                    <td className="sm2-td">
                      <span className="sm2-type-badge"
                        style={{ color: tCfg.color, background: tCfg.bg }}>
                        {row._type}
                      </span>
                    </td>
                    <td className="sm2-td sm2-td--num">{fmtFull(row._reach)}</td>
                    <td className="sm2-td sm2-td--num">{fmtFull(row._views)}</td>
                    <td className="sm2-td sm2-td--num">{fmtFull(row._likes)}</td>
                    <td className="sm2-td sm2-td--num">{fmtFull(row._shares)}</td>
                    <td className="sm2-td sm2-td--num">
                      <span className="sm2-er-cell"
                        style={{
                          background: row._er >= 5 ? '#DCFCE7' : row._er >= 2 ? '#FEF9C3' : '#FEE2E2',
                          color:      row._er >= 5 ? '#166534' : row._er >= 2 ? '#713F12' : '#991B1B',
                        }}>
                        {row._er.toFixed(1)}%
                      </span>
                    </td>
                    <td className="sm2-td">
                      {row.link && (
                        <a href={row.link} target="_blank" rel="noreferrer"
                           className="sm2-link-btn" aria-label="View post">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={8} className="sm2-td sm2-td--empty">Tidak ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="sm2-pagination" role="navigation" aria-label="Table pagination">
            <button
              className="sm2-page-btn"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="sm2-page-info">
              {page + 1} / {totalPages}
            </span>
            <button
              className="sm2-page-btn"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function SocialMedia({ data }) {
  const [mainTab,    setMainTab]    = useState('planner')
  const [plannerAcc, setPlannerAcc] = useState(ACCOUNTS[0].name)
  const [perfAcc,    setPerfAcc]    = useState(ACCOUNTS[0].name)

  const posts     = data?.posts     ?? []
  const analytics = data?.analytics ?? []

  const plannerCfg = getAccCfg(plannerAcc)
  const perfCfg    = getAccCfg(perfAcc)

  const plannerPosts = useMemo(() =>
    posts.filter(p => p.account === plannerAcc),
  [posts, plannerAcc])

  const plannerAna = useMemo(() =>
    analytics.filter(a => a.account === plannerAcc),
  [analytics, plannerAcc])

  const perfAna = useMemo(() =>
    analytics.filter(a => a.account === perfAcc),
  [analytics, perfAcc])

  if (!analytics.length && !posts.length) {
    return (
      <div className="sm2-empty-state">
        <AtSign size={40} style={{ opacity: 0.25 }} aria-hidden="true" />
        <p>Memuat data social media…</p>
      </div>
    )
  }

  return (
    <div className="sm2-page">
      <div className="sm2-page-head">
        <h1 className="page-title">Social Media</h1>
        <div className="sm2-page-badges">
          <span className="sm2-badge sm2-badge--purple">{posts.length} posts</span>
          <span className="sm2-badge sm2-badge--blue">{analytics.length} analitik</span>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="sm2-main-tabs" role="tablist" aria-label="Social Media Sections">
        {[
          { id: 'planner',     label: 'Content Planner'          },
          { id: 'performance', label: 'Social Media Performance'  },
        ].map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={mainTab === t.id}
            className={`sm2-main-tab ${mainTab === t.id ? 'active' : ''}`}
            onClick={() => setMainTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Planner Panel */}
      <div className="sm2-panel" aria-hidden={mainTab !== 'planner'}
           style={{ display: mainTab === 'planner' ? 'block' : 'none' }}>
        <AccountTabBar selected={plannerAcc} onChange={setPlannerAcc} />
        <ContentPlannerSection
          posts={plannerPosts}
          analytics={plannerAna}
          accCfg={plannerCfg}
        />
      </div>

      {/* Performance Panel */}
      <div className="sm2-panel" aria-hidden={mainTab !== 'performance'}
           style={{ display: mainTab === 'performance' ? 'block' : 'none' }}>
        <AccountTabBar selected={perfAcc} onChange={setPerfAcc} />
        <PerformanceSection analytics={perfAna} accCfg={perfCfg} />
      </div>
    </div>
  )
}
