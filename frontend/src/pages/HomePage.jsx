import { Link } from 'react-router-dom'
import HeroBooking from '../components/HeroBooking.jsx'
import CityStrip from '../components/CityStrip.jsx'
import TurfFormats from '../components/TurfFormats.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import VenueGallery from '../components/VenueGallery.jsx'
import Roll from '../components/Roll.jsx'
import { api } from '../lib/api.js'
import { useAsync } from '../lib/useAsync.js'
import { savedCity } from '../lib/format.js'

export default function HomePage() {
  const cities = useAsync(() => api.cities(), [])

  if (cities.error) {
    return (
      <div className="wrap page-message">
        <h1>We can't load the grounds right now</h1>
        <p>{cities.error.message}</p>
        <button className="btn btn-secondary" onClick={cities.reload}>Try again</button>
      </div>
    )
  }

  return (
    <>
      <HeroBooking cities={cities.data ?? []} />
      {cities.data && <CityStrip cities={cities.data} />}
      <TurfFormats />
      <HowItWorks />
      <VenueGallery />
      <section className="closing" aria-labelledby="closing-title">
        <div className="wrap closing-inner">
          <h2 id="closing-title"><span>Tonight's slots</span> <mark>are filling up</mark></h2>
          <Link className="btn btn-primary roll-host" to={`/${savedCity()}`}><Roll>Find a slot tonight</Roll></Link>
        </div>
      </section>
    </>
  )
}
