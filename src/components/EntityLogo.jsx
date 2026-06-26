import './EntityLogo.css'

const BASE = import.meta.env.BASE_URL

export const ENTITY_LOGOS = {
  HAI: `${BASE}logos/HAI.png`,
  HAP: `${BASE}logos/HAP.png`,
  ASI: `${BASE}logos/ASI.png`,
  BPN: `${BASE}logos/BPN.png`,
  CMS: `${BASE}logos/CMS.png`,
  IAS: `${BASE}logos/IAS.png`,
  HPA: `${BASE}logos/HPA.png`,
}

export const ENTITY_COLORS = {
  HAI: '#CC1010', HAP: '#007AFF', ASI: '#E8A000',
  BPN: '#2B5CE6', CMS: '#6B4F2A', IAS: '#2E7D32', HPA: '#0091A8',
}

export default function EntityLogo({ entity, size = 32 }) {
  const src = ENTITY_LOGOS[entity]
  if (!src) return null
  return (
    <span className="ent-logo" style={{ width: size, height: size, minWidth: size }}>
      <img src={src} alt={entity} />
    </span>
  )
}
