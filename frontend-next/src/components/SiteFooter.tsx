import { Link } from "react-router-dom";
import { BrandLockup } from "@/components/SiteHeader";
import type { CityDto } from "@/types";

interface SiteFooterProps {
  cities: CityDto[];
  onPickCity: (slug: string) => void;
}

export function SiteFooter({ cities, onPickCity }: SiteFooterProps) {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="footer-inner page-frame">
        <div className="footer-brand">
          <BrandLockup />
          <p>
            Floodlit football turfs in {cities.length ? `${cities.length} cities across India` : "cities across India"}.
            Open 6 am to midnight. Book by the hour and pay with UPI.
          </p>
        </div>

        <nav className="footer-col" aria-labelledby="footer-play">
          <p id="footer-play" className="footer-label">
            Play
          </p>
          <a href="#arenas">Arenas</a>
          <a href="#how-it-works">How it works</a>
          <a href="#network">Network</a>
          <Link to="/admin">Staff</Link>
        </nav>

        <div className="footer-col footer-cities" role="group" aria-labelledby="footer-cities">
          <p id="footer-cities" className="footer-label">
            Cities
          </p>
          {cities.map((city) => (
            <button
              key={city.slug}
              type="button"
              onClick={() => onPickCity(city.slug)}
              data-testid={`footer-city-${city.slug}`}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      <div className="footer-base page-frame">
        <span>© {new Date().getFullYear()} Ice Realm</span>
        <span>Prices are per hour and include GST</span>
      </div>
    </footer>
  );
}
