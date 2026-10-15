import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo.jsx'
import Roll from './Roll.jsx'
import SpaceBackdrop from './SpaceBackdrop.jsx'
import { savedCity } from '../lib/format.js'

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)

  // Over the home hero the header starts transparent and turns solid once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const bookSlot = () => {
    const console = document.getElementById('book')
    if (isHome && console) {
      console.scrollIntoView({ behavior: 'smooth', block: 'center' })
      console.querySelector('select')?.focus({ preventScroll: true })
    } else {
      navigate(`/${savedCity()}`)
    }
  }

  return (
    <>
      <SpaceBackdrop />
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={`site-header ${isHome ? 'is-overlay' : ''} ${scrolled || !isHome ? 'is-solid' : ''}`}>
        <div className="wrap header-inner">
          <Link to="/" className="header-logo" aria-label="Ice Realm home"><Logo /></Link>
          <nav className="header-nav" aria-label="Main">
            <NavLink className="roll-host" to={`/${savedCity()}`}><Roll>Grounds</Roll></NavLink>
            <Link className="roll-host" to="/#how"><Roll>How it works</Roll></Link>
            <NavLink className="roll-host" to="/booking"><Roll>My booking</Roll></NavLink>
          </nav>
          <button type="button" className="header-cta roll-host" onClick={bookSlot}>
            <Roll>Book a slot</Roll>
            <span className="header-cta-icon" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="main" className={isHome ? '' : 'main-offset'}>{children}</main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <div>
            <Logo size={32} />
            <p>Floodlit football turfs across Maharashtra, Delhi and India's metro cities. Open 6 am to midnight.</p>
          </div>
          <div className="footer-links">
            <p className="label">Help</p>
            <Link to="/booking">Find my booking</Link>
            <a href="tel:+919000000000">Call us: +91 90000 00000</a>
            <Link to="/admin">Staff</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
