import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, Ticket, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import markUrl from "@/assets/brand/ice-realm-mark-96.png";
import wordmarkUrl from "@/assets/brand/ice-realm-wordmark.png";

const navLinks = [
  { href: "#arenas", label: "Arenas" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#network", label: "Network" },
];

/** The crest and name. On the home page it jumps to the top; elsewhere it goes home. */
export function BrandLockup({ testId, home = false }: { testId?: string; home?: boolean }) {
  const content = (
    <>
      <span className="brand-mark">
        <img src={markUrl} alt="" width={40} height={40} data-testid={testId && `${testId}-image`} />
      </span>
      <img
        className="brand-wordmark"
        src={wordmarkUrl}
        alt="Ice Realm"
        width={684}
        height={76}
        data-testid={testId && "header-brand-name"}
      />
    </>
  );
  return home ? (
    <Link className="brand-lockup" to="/" data-testid={testId}>
      {content}
    </Link>
  ) : (
    <a className="brand-lockup" href="#top" data-testid={testId}>
      {content}
    </a>
  );
}

interface SiteHeaderProps {
  onBook: () => void;
  fixtureCount: number;
  onOpenFixtures: () => void;
}

export function SiteHeader({ onBook, fixtureCount, onOpenFixtures }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Transparent over the hero; turns solid once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the mobile menu, and so does widening the window past the breakpoint.
  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia("(min-width: 901px)");
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    const onResize = () => desktop.matches && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [menuOpen]);

  const book = () => {
    setMenuOpen(false);
    onBook();
  };

  const openFixtures = () => {
    setMenuOpen(false);
    onOpenFixtures();
  };

  return (
    <header className={`site-header ${scrolled || menuOpen ? "is-solid" : ""}`} data-testid="site-header">
      <div className="header-inner page-frame">
        <BrandLockup testId="header-logo" />

        <nav className="header-nav" aria-label="Main">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} data-testid={`nav-${link.href.slice(1)}-link`}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="fixtures-button"
            onClick={openFixtures}
            aria-label={fixtureCount ? `My fixtures, ${fixtureCount} held` : "My fixtures"}
            data-testid="header-fixtures-button"
          >
            <Ticket size={17} aria-hidden="true" />
            <span className="fixtures-button-label">My fixtures</span>
            {fixtureCount > 0 && (
              <span className="fixtures-count" aria-hidden="true">
                {fixtureCount}
              </span>
            )}
          </button>

          <Button className="primary-glow-button header-cta" onClick={book} data-testid="header-book-button">
            Book a pitch <ArrowUpRight size={16} />
          </Button>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            data-testid="header-menu-button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <nav id="mobile-nav" className="mobile-nav" aria-label="Main" hidden={!menuOpen} data-testid="mobile-nav">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
        <button type="button" className="mobile-nav-item" onClick={openFixtures} data-testid="mobile-fixtures-button">
          My fixtures
          {fixtureCount > 0 && <span className="fixtures-count">{fixtureCount} held</span>}
        </button>
        <Button className="primary-glow-button" onClick={book}>
          Book a pitch <ArrowUpRight size={16} />
        </Button>
      </nav>
    </header>
  );
}
