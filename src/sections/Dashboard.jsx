import { Users, Cake, CalendarDays, FileText, Eye, Heart, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './Dashboard.css'

const ENTITY_COLORS = {
  HAI:'#FF3B30', HAP:'#007AFF', ASI:'#34C759',
  BPN:'#FF9500', CMS:'#AF52DE', IAS:'#FF2D55', HPA:'#5AC8FA',
}

function parseRp(str) {
  return parseInt(String(str||'0').replace(/[^0-9]/g,''))||0
}

function getBirthdayMonth(employees) {
  const m = new Date().getMonth()+1
  return employees.filter(e => {
    const p = String(e.birthDate||'').split('/')
    return parseInt(p[1])===m
  })
}

const KPI_CONFIG = [
  { key:'employees', icon: Users,       color:'--red',    label:'Total Karyawan',       sub:'7 entitas aktif' },
  { key:'birthdays', icon: Cake,        color:'--orange', label:'Ulang Tahun Bulan Ini', sub: null },
  { key:'events',    icon: CalendarDays,color:'--blue',   label:'Internal Events',       sub:'Sepanjang tahun' },
  { key:'posts',     icon: FileText,    color:'--purple', label:'Total Posts',           sub:'Semua akun' },
  { key:'reach',     icon: Eye,         color:'--teal',   label:'Total Reach',           sub:'Jangkauan konten' },
  { key:'likes',     icon: Heart,       color:'--red',    label:'Total Likes',           sub:'Engagement' },
  { key:'budget',    icon: Wallet,      color:'--green',  label:'Realisasi Anggaran',    sub:'Total ER expenses' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13, boxShadow:'var(--shadow-md)' }}>
      <p style={{ fontWeight:600, marginBottom:6, color:'var(--label)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: Rp {p.value.toFixed(2)}M
        </p>
      ))}
    </div>
  )
}

export default function Dashboard({ data }) {
  if (!data) return null
  const emp = data.employees||[], evt = data.events||[]
  const pst = data.posts||[], exp = data.expenses||[]
  const ana = data.analytics||[]

  const birthdays  = getBirthdayMonth(emp)
  const totalBudget= exp.reduce((s,e)=>s+parseRp(e.realizationAmount),0)
  const totalReach = ana.reduce((s,a)=>s+(a.reach||0),0)
  const totalLikes = ana.reduce((s,a)=>s+(a.likes||0),0)

  const month = new Date().toLocaleString('id-ID',{month:'long'})

  const values = {
    employees: emp.length,
    birthdays:  birthdays.length,
    events:     evt.length,
    posts:      pst.length,
    reach:      totalReach.toLocaleString('id-ID'),
    likes:      totalLikes.toLocaleString('id-ID'),
    budget:     `Rp ${(totalBudget/1e6).toFixed(1)}M`,
  }

  const pieData = Object.entries(
    emp.reduce((a,e)=>{ a[e.entity]=(a[e.entity]||0)+1; return a },{})
  ).map(([name,value])=>({name,value}))

  const barData = exp
    .filter(e=>parseRp(e.realizationAmount)>0||parseRp(e.submissionAmount)>0)
    .map(e=>({
      name: e.activityName.length>20 ? e.activityName.slice(0,20)+'…' : e.activityName,
      Pengajuan: parseRp(e.submissionAmount)/1e6,
      Realisasi: parseRp(e.realizationAmount)/1e6,
    }))

  return (
    <div className="dashboard">
      <h1 className="page-title" style={{marginBottom:20}}>Dashboard</h1>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {KPI_CONFIG.map(({ key, icon: Icon, color, label, sub }) => (
          <div className="kpi-card card" key={key}>
            <div className="kpi-icon-wrap" style={{ background:`var(${color}-light)` }}>
              <Icon size={18} style={{ color:`var(${color})` }} strokeWidth={2} />
            </div>
            <div className="kpi-val">{values[key]}</div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-sub">{sub || (key==='birthdays' ? month : '')}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="card chart-box">
          <p className="chart-title">Karyawan per Entitas</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                dataKey="value" paddingAngle={3}>
                {pieData.map(e=>(
                  <Cell key={e.name} fill={ENTITY_COLORS[e.name]||'#8E8E93'} />
                ))}
              </Pie>
              <Tooltip formatter={(v,n)=>[`${v} orang`,n]}
                contentStyle={{ borderRadius:10, border:'1px solid var(--border)', fontSize:13 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-box">
          <p className="chart-title">Pengajuan vs Realisasi (Juta Rp)</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={barData} margin={{ left:0, right:8, bottom:8 }} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize:10, fill:'#8E8E93' }} angle={-15} textAnchor="end" height={52} />
              <YAxis tick={{ fontSize:11, fill:'#8E8E93' }} tickFormatter={v=>`${v}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
              <Bar dataKey="Pengajuan" fill="#BAD6FF" radius={[4,4,0,0]} />
              <Bar dataKey="Realisasi" fill="#FF3B30" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Birthday list */}
      {birthdays.length > 0 && (
        <div className="card birthday-section">
          <div className="birthday-header">
            <Cake size={16} color="var(--orange)" strokeWidth={2} />
            <span>Ulang Tahun {month} &mdash; {birthdays.length} orang</span>
          </div>
          <div className="birthday-grid">
            {birthdays.map((e,i)=>(
              <div className="birthday-chip" key={i}>
                <div className="bd-avatar">{e.nama.charAt(0)}</div>
                <div>
                  <div className="bd-name">{e.nama}</div>
                  <div className="bd-meta">{e.entity} · {e.birthDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
