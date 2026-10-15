import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLockup } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="ice-app staff-page">
      <header className="site-header is-solid">
        <div className="header-inner page-frame">
          <BrandLockup home />
        </div>
      </header>
      <main className="staff-main page-frame not-found">
        <h1>That page isn't here</h1>
        <p className="section-lede">The link may be old, or mistyped. Every arena is on the home page.</p>
        <Link className="primary-glow-button not-found-link" to="/">
          Go to the arenas <ArrowUpRight size={16} />
        </Link>
      </main>
    </div>
  );
}
