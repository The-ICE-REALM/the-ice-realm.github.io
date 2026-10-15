import logoSmall from '../assets/brand/ice-realm-logo-256.png'

/** Small ice-crystal glyph for card labels; echoes the logo's six-point star. */
export function FrostStar({ size = 16, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="-10 -10 20 20" aria-hidden="true">
      <path d="M0-9 2.25-3.9 7.8-4.5 4.5 0 7.8 4.5 2.25 3.9 0 9-2.25 3.9-7.8 4.5-4.5 0-7.8-4.5-2.25-3.9Z" fill="currentColor" />
    </svg>
  )
}

export default function Logo({ size = 36 }) {
  return (
    <span className="logo">
      <img src={logoSmall} width={size} height={size} alt="" className="logo-mark" />
      <span className="logo-word">Ice Realm</span>
    </span>
  )
}
