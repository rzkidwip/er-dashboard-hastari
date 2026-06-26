import { Banknote, TrendingDown, ArrowDownLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import './Expenses.css'

function parseRp(s){ return parseInt(String(s||'0').replace(/[^0-9]/g,''))||0 }
function fmt(n){ return 'Rp '+n.toLocaleString('id-ID') }

export default function Expenses({ data }) {
  const exp = data?.expenses||[]

  const totalSub  = exp.reduce((s,e)=>s+parseRp(e.submissionAmount),0)
  const totalReal = exp.reduce((s,e)=>s+parseRp(e.realizationAmount),0)
  const totalRef  = exp.reduce((s,e)=>s+parseRp(e.refundAmount),0)
  const done      = exp.filter(e=>e.status?.toLowerCase().includes('done')).length

  const kpis = [
    { icon:Banknote,     color:'var(--blue)',  label:'Total Pengajuan', val:fmt(totalSub) },
    { icon:TrendingDown, color:'var(--red)',   label:'Total Realisasi', val:fmt(totalReal) },
    { icon:ArrowDownLeft,color:'var(--green)', label:'Efisiensi / Sisa', val:fmt(totalRef) },
    { icon:CheckCircle2, color:'var(--orange)',label:'Selesai',          val:`${done} / ${exp.length}` },
  ]

  const barData = exp
    .filter(e=>parseRp(e.realizationAmount)>0||parseRp(e.submissionAmount)>0)
    .map(e=>({
      name: e.activityName.length>20?e.activityName.slice(0,20)+'…':e.activityName,
      Pengajuan: parseRp(e.submissionAmount)/1e6,
      Realisasi: parseRp(e.realizationAmount)/1e6,
    }))

  return (
    <div className="exp-page">
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
        <h1 className="page-title">Expense Tracker</h1>
      </div>

      {/* KPI */}
      <div className="exp-kpis">
        {kpis.map(k=>(
          <div className="card exp-kpi" key={k.label}>
            <k.icon size={18} color={k.color} strokeWidth={2}/>
            <div className="exp-kpi-val">{k.val}</div>
            <div className="exp-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {barData.length>0 && (
        <div className="card" style={{padding:18,marginBottom:16}}>
          <p style={{fontSize:13,fontWeight:600,color:'var(--label-2)',marginBottom:12}}>Pengajuan vs Realisasi (Juta Rp)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{left:0,right:8,bottom:8}} barGap={2}>
              <XAxis dataKey="name" tick={{fontSize:10,fill:'var(--label-3)'}} angle={-15} textAnchor="end" height={54}/>
              <YAxis tick={{fontSize:11,fill:'var(--label-3)'}} tickFormatter={v=>`${v}M`}/>
              <Tooltip contentStyle={{borderRadius:10,border:'1px solid var(--border)',fontSize:13}}
                formatter={v=>[`Rp ${v.toFixed(2)}M`]}/>
              <Bar dataKey="Pengajuan" fill="#BAD6FF" radius={[4,4,0,0]}/>
              <Bar dataKey="Realisasi" fill="#FF3B30" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{overflow:'hidden'}}>
        <table className="apple-table">
          <thead><tr>
            <th>ID</th><th>Kegiatan</th>
            <th style={{textAlign:'right'}}>Pengajuan</th>
            <th style={{textAlign:'right'}}>Realisasi</th>
            <th style={{textAlign:'right'}}>Efisiensi</th>
            <th style={{textAlign:'center'}}>Rate</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            {exp.length===0
              ? <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'var(--label-3)'}}>Tidak ada data</td></tr>
              : exp.map((e,i)=>{
                const rate = parseFloat(e.efficiencyRate)||0
                const barColor = rate>=90?'var(--green)':rate>=70?'var(--orange)':'var(--red)'
                const isDone = e.status?.toLowerCase().includes('done')
                return (
                  <tr key={i}>
                    <td style={{fontFamily:'monospace',fontSize:12,color:'var(--label-3)'}}>{e.expenseId}</td>
                    <td style={{fontWeight:500,maxWidth:220}}>{e.activityName}</td>
                    <td style={{textAlign:'right',fontSize:13}}>{fmt(parseRp(e.submissionAmount))}</td>
                    <td style={{textAlign:'right',fontSize:13,fontWeight:600,color:'var(--red)'}}>{fmt(parseRp(e.realizationAmount))}</td>
                    <td style={{textAlign:'right',fontSize:13,color:'var(--green)'}}>{fmt(parseRp(e.refundAmount))}</td>
                    <td style={{textAlign:'center'}}>
                      {e.efficiencyRate
                        ? <div className="eff-wrap">
                            <div className="eff-track">
                              <div className="eff-fill" style={{width:`${Math.min(rate,100)}%`,background:barColor}}/>
                            </div>
                            <span className="eff-text" style={{color:barColor}}>{e.efficiencyRate}</span>
                          </div>
                        : <span style={{color:'var(--label-4)',fontSize:12}}>—</span>}
                    </td>
                    <td>
                      <span style={{
                        display:'inline-flex',alignItems:'center',gap:4,
                        padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:500,
                        background:isDone?'var(--green-light)':'var(--orange-light)',
                        color:isDone?'#1A7F37':'#B25000',
                      }}>
                        {isDone?<CheckCircle2 size={11}/>:<Loader2 size={11}/>}
                        {e.status||'—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
