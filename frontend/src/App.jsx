import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import CityPage from './pages/CityPage.jsx'
import VenuePage from './pages/VenuePage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (pathname === '/') document.title = 'Ice Realm · Book a football turf'
    if (hash) {
      // Wait a frame so the target section has rendered.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }))
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/venue/:id" element={<VenuePage />} />
        <Route path="/checkout/:ref" element={<CheckoutPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/:ref" element={<BookingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/:city" element={<CityPage />} />
        <Route path="*" element={
          <div className="wrap page-message">
            <h1>That page isn't here</h1>
            <Link className="btn btn-secondary" to="/">Go to the home page</Link>
          </div>
        } />
      </Routes>
    </Layout>
  )
}
