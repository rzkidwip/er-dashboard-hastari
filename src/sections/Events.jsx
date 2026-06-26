import { MapPin, User, Banknote, CheckCircle2, Clock, CalendarClock, Users } from 'lucide-react'
import './Events.css'

const STATUS = {
  completed : { label:'Completed', color:'var(--green)',  bg:'var(--green-light)',  Icon: CheckCircle2 },
  'on-going': { label:'On-Going',  color:'var(--blue)',   bg:'var(--blue-light)',   Icon: Clock },
  upcoming  : { label:'Upcoming',  color:'var(--orange)', bg:'var(--orange-light)', Icon: CalendarClock },
  planning  : { label:'Planning',  color:'var(--orange)', bg:'var(--orange-light)', Icon: CalendarClock },
}

function getStatus(raw='') {
  return STATUS[raw.toLowerCase()] || { label:raw||'N/A', color:'var(--label-3)', bg:'var(--surface-2)', Icon: Clock }
}

function parseRp(s){ return parseInt(String(s||'0').replace(/[^0-9]/g,''))||0 }

export default function Events({ data }) {
  const events = data?.events||[]
  const volunteers = data?.volunteers||[]

  const done = events.filter(e=>e.status?.toLowerCase().includes('complet')).length
  const total = events.reduce((s,e)=>s+parseRp(e.budget),0)

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

      <div className="events-grid">
        {events.map((ev,i)=>{
          const s = getStatus(ev.status)
          const vols = volunteers.filter(v=>v.eventName===ev.eventName)
          return (
            <div className="card event-card" key={i}>
              <div className="ev-top">
                <span className="ev-status-chip" style={{background:s.bg,color:s.color}}>
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
                  {vols.length>0 && (
                    <span className="ev-row"><Users size={12} color="var(--blue)"/>{vols.length} vol.</span>
                  )}
                  <span className="ev-budget">Rp {parseRp(ev.budget).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )
        })}
        {events.length===0 && (
          <p style={{color:'var(--label-3)',padding:32}}>Belum ada event</p>
        )}
      </div>
    </div>
  )
}
