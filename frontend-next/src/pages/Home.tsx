import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CloudOff,
  Crosshair,
  LocateFixed,
  MapPin,
  Search,
  Snowflake,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { ArenaCard } from "@/components/ArenaCard";
import { BookingDialog } from "@/components/BookingDialog";
import { FixturesSheet } from "@/components/FixturesSheet";
import { FreezingCrest, type CrestFreeze } from "@/components/FreezingCrest";
import { HowItWorks } from "@/components/HowItWorks";
import { PaymentDialog } from "@/components/PaymentDialog";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import crestUrl from "@/assets/brand/ice-realm-logo.webp";
import { ApiError, api } from "@/lib/api";
import { upcomingMatchdays } from "@/lib/booking";
import { useFixtures } from "@/lib/fixtures";
import { formatKm, isPermissionDenied, locateCustomer, nearYou, type NearYou } from "@/lib/location";
import { scrollToSection } from "@/lib/scroll";
import { useApi } from "@/lib/useApi";
import type { BookingDto, VenueDto } from "@/types";

/** The "every city" choice in the city tabs and the hero's city picker. */
const ALL = "all";

type FormatFilter = "All formats" | "5-a-side" | "7-a-side" | "Futsal";
const formatFilters: FormatFilter[] = ["All formats", "5-a-side", "7-a-side", "Futsal"];

/** Which arenas the crest leads to: near the customer, or a city when their location isn't available. */
type Landing = { kind: "near"; near: NearYou } | { kind: "city"; city: string };
type Notice = { title: string; description: string };
type FreezeRun = { id: number; frozen: boolean; settled: boolean; landed: boolean };

const LOCATING_TOAST = "locating";
const twoDigits = (count: number) => String(count).padStart(2, "0");

export default function Home() {
  const matchdays = useMemo(() => upcomingMatchdays(7), []);
  const cities = useApi(() => api.cities(), "cities");
  const venues = useApi(() => api.venues(), "venues");
  const availability = useApi(() => api.availability(matchdays[0].iso, matchdays.length), "availability");

  const [activeCity, setActiveCity] = useState(ALL);
  const [activeFormat, setActiveFormat] = useState<FormatFilter>("All formats");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(matchdays[0].iso);
  const [bookingVenue, setBookingVenue] = useState<VenueDto | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSession, setBookingSession] = useState(0);
  const [fixturesOpen, setFixturesOpen] = useState(false);
  const [payment, setPayment] = useState<{ booking: BookingDto; phone: string } | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { fixtures, upcoming, remember, update, forget, refresh, phoneFor } = useFixtures();
  const [near, setNear] = useState<NearYou | null>(null);
  const [freeze, setFreeze] = useState<CrestFreeze | null>(null);
  const [revealing, setRevealing] = useState(false);
  const bookingTrigger = useRef<HTMLElement | null>(null);
  const fixturesTrigger = useRef<HTMLElement | null>(null);
  const freezeRun = useRef<FreezeRun | null>(null);
  const crestButtonRef = useRef<HTMLButtonElement>(null);
  const thawWatch = useRef<IntersectionObserver | null>(null);
  const escapeToSkip = useRef<((event: KeyboardEvent) => void) | null>(null);
  const notice = useRef<Notice | null>(null);
  const landing = useRef<Landing | null>(null);
  const cityTabsRef = useRef<HTMLDivElement>(null);

  const cityList = useMemo(() => cities.data ?? [], [cities.data]);
  const venueList = useMemo(() => venues.data ?? [], [venues.data]);
  const selectedDay = matchdays.find((day) => day.iso === selectedDate) ?? matchdays[0];
  const cityName = (slug: string) => cityList.find((city) => city.slug === slug)?.name ?? "your city";

  const openCounts = useMemo(
    () => new Map((availability.data ?? []).map((count) => [`${count.turfId}|${count.date}`, count.openSlots])),
    [availability.data]
  );
  const openHoursAt = (venue: VenueDto) =>
    availability.data
      ? venue.turfs.reduce((sum, turf) => sum + (openCounts.get(`${turf.id}|${selectedDay.iso}`) ?? 0), 0)
      : undefined;

  const filteredVenues = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = venueList.filter(
      (venue) =>
        (activeCity === ALL || venue.citySlug === activeCity) &&
        (activeFormat === "All formats" || venue.turfs.some((turf) => turf.format === activeFormat)) &&
        (!needle ||
          [venue.name, venue.area, venue.cityName, ...venue.turfs.map((turf) => turf.format)].some((field) =>
            field.toLowerCase().includes(needle)
          ))
    );
    // Once we know where the customer is, the nearest arenas come first.
    const distances = near?.distances;
    return distances
      ? [...matches].sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity))
      : matches;
  }, [venueList, activeCity, activeFormat, query, near]);

  const isFiltered = activeCity !== ALL || activeFormat !== "All formats" || query.trim() !== "";

  // On narrow screens the city tabs scroll sideways; keep the chosen city in view, wherever it was picked.
  useEffect(() => {
    const container = cityTabsRef.current;
    const tab = container?.querySelector<HTMLElement>(".city-tab.is-active");
    if (!container || !tab || container.scrollWidth <= container.clientWidth) return;
    const offset = tab.getBoundingClientRect().left - container.getBoundingClientRect().left;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollBy({
      left: offset - (container.clientWidth - tab.offsetWidth) / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeCity]);

  const rememberTrigger = () => (document.activeElement instanceof HTMLElement ? document.activeElement : null);

  const openBooking = (venue: VenueDto) => {
    bookingTrigger.current = rememberTrigger();
    toast.dismiss();
    setBookingVenue(venue);
    // A fresh session per opening resets the dialog's pitch, slot, form and payment state.
    setBookingSession((session) => session + 1);
    setBookingOpen(true);
  };

  const openFixtures = () => {
    fixturesTrigger.current = rememberTrigger();
    toast.dismiss();
    void refresh();
    setFixturesOpen(true);
  };

  const payFor = (booking: BookingDto) => {
    const phone = phoneFor(booking.ref);
    if (!phone) return;
    setFixturesOpen(false);
    setPayment({ booking, phone });
    setPaymentOpen(true);
  };

  const bookingChanged = (booking: BookingDto) => {
    update(booking);
    setPayment((current) => (current?.booking.ref === booking.ref ? { ...current, booking } : current));
    // A cancelled or expired booking frees its hours.
    if (booking.status === "CANCELLED" || booking.status === "EXPIRED") availability.reload();
  };

  const findBooking = async (ref: string, phone: string) => {
    remember(await api.booking(ref, phone), phone);
  };

  const findPitch = (event?: FormEvent) => {
    event?.preventDefault();
    scrollToSection("arenas");
  };

  const pickCity = (slug: string) => {
    setActiveCity(slug);
    scrollToSection("arenas");
  };

  const clearFilters = () => {
    setActiveCity(ALL);
    setActiveFormat("All formats");
    setQuery("");
  };

  /** Shows the arenas once the crest has frozen and it's known which to show, whichever happens last. */
  const landIfReady = () => {
    const run = freezeRun.current;
    if (!run || !run.frozen || !run.settled || run.landed) return;
    run.landed = true;
    toast.dismiss(LOCATING_TOAST);
    if (escapeToSkip.current) {
      window.removeEventListener("keydown", escapeToSkip.current);
      escapeToSkip.current = null;
    }

    const target = landing.current;
    setActiveFormat("All formats");
    setQuery("");
    if (target?.kind === "near") {
      setNear(target.near);
      setActiveCity(target.near.citySlug);
    } else if (target) {
      setActiveCity(target.city);
    }
    setRevealing(true);
    // Let the new cards render, then glide down to them.
    requestAnimationFrame(() => scrollToSection("arenas"));
    if (notice.current) toast.info(notice.current.title, { description: notice.current.description });
    window.setTimeout(() => setRevealing(false), 2600);

    // Thaw the crest once it has scrolled out of view, ready for the next tap.
    const crestButton = crestButtonRef.current;
    if (crestButton) {
      thawWatch.current = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) return;
        thawWatch.current?.disconnect();
        setFreeze((current) => (current?.id === run.id ? null : current));
      });
      thawWatch.current.observe(crestButton);
    }
  };

  /** Records which arenas to show, unless that search was already settled or skipped. */
  const settleFreeze = (id: number, target: Landing, note?: Notice) => {
    const run = freezeRun.current;
    if (!run || run.id !== id || run.settled) return;
    run.settled = true;
    landing.current = target;
    notice.current = note ?? null;
    landIfReady();
  };

  const skipFreeze = () => {
    const run = freezeRun.current;
    if (run) settleFreeze(run.id, { kind: "city", city: ALL });
  };

  const crestFrozen = () => {
    const run = freezeRun.current;
    if (!run || run.frozen) return;
    run.frozen = true;
    if (!run.settled) {
      // Usually the browser's location prompt is still open: say what's happening, and offer a way out.
      toast.loading("Finding turfs near you", {
        id: LOCATING_TOAST,
        description: "Allow location if your browser asks. It's only used to sort arenas by distance.",
        duration: Infinity,
        action: { label: "Show all turfs", onClick: skipFreeze },
      });
      escapeToSkip.current = (event: KeyboardEvent) => {
        if (event.key === "Escape") skipFreeze();
      };
      window.addEventListener("keydown", escapeToSkip.current);
    }
    landIfReady();
  };

  // Tapping the big crest freezes it, then the page glides down to the arenas nearest the customer.
  const freezeToTurfs = (event: MouseEvent<HTMLButtonElement>) => {
    const previous = freezeRun.current;
    if (previous && !previous.landed) return;
    thawWatch.current?.disconnect();
    const id = (previous?.id ?? 0) + 1;
    const fallbackCity = activeCity;
    const showing = fallbackCity === ALL ? "Showing every arena" : `Showing ${cityName(fallbackCity)}`;
    freezeRun.current = { id, frozen: false, settled: false, landed: false };
    toast.dismiss();
    // detail is 0 when the button was pressed from the keyboard.
    setFreeze({ id, from: event.detail > 0 ? { x: event.clientX, y: event.clientY } : null });

    locateCustomer()
      .then((spot) => api.venuesNear(spot.lat, spot.lng))
      .then((nearby) => {
        const found = nearYou(nearby);
        if (!found) throw new ApiError("NOT_FOUND", "There are no arenas to show yet.");
        settleFreeze(
          id,
          { kind: "near", near: found },
          found.inCoverage
            ? undefined
            : {
                title: "Ice Realm isn't in your city yet",
                description: `Showing ${found.cityName}, the closest, ${formatKm(found.km)} away.`,
              }
        );
      })
      .catch((error: unknown) =>
        settleFreeze(
          id,
          { kind: "city", city: fallbackCity },
          isPermissionDenied(error)
            ? {
                title: "Location is off",
                description: `${showing}. Allow location for this site to see the nearest first.`,
              }
            : error instanceof ApiError
              ? { title: "Couldn't sort arenas by distance", description: `${showing}. ${error.message}` }
              : { title: "Couldn't find your location", description: `${showing}. Tap the crest to try again.` }
        )
      );
  };

  const nearMe = near !== null && activeCity === near.citySlug;
  const arenaWord = (count: number) => (count === 1 ? "arena" : "arenas");
  const countLine = !venues.data
    ? "Loading arenas…"
    : nearMe
      ? near.inCoverage
        ? `${filteredVenues.length} ${arenaWord(filteredVenues.length)} near you in ${near.cityName}, nearest first`
        : `No arenas near you yet. ${near.cityName} is the closest city, ${formatKm(near.km)} away`
      : `Showing ${filteredVenues.length} of ${venueList.length} arenas for ${selectedDay.label}${near ? ", nearest first" : ""}`;

  const anyModalOpen = bookingOpen || fixturesOpen || paymentOpen;

  return (
    <div className="ice-app">
      {/* Below the fixed header normally; at the top edge while a dialog or sheet covers the page. */}
      <Toaster
        position="top-center"
        theme="dark"
        offset={{ top: anyModalOpen ? 12 : 88 }}
        mobileOffset={{ top: anyModalOpen ? 12 : 84 }}
      />
      <a className="skip-link" href="#arenas">
        Skip to arenas
      </a>

      {/* Header */}
      <SiteHeader onBook={findPitch} fixtureCount={upcoming.length} onOpenFixtures={openFixtures} />

      <main>
        {/* Hero Section */}
        <section className="hero-section" id="top" data-testid="hero-section">
          <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          <div className="hero-content page-frame">
            <div className="hero-copy">
              <div className="eyebrow" data-testid="hero-eyebrow">
                <span className="live-dot" />
                India's coldest football booking network
              </div>
              <h1 data-testid="hero-headline">
                FREEZE
                <br />
                <em>THE PITCH</em>
                <span className="headline-dot">.</span>
              </h1>
              <p data-testid="hero-description">
                Premium turfs for players who bring their own weather. Find your arena, lock your hour, and let the game
                get loud.
              </p>
              <div className="hero-actions" data-testid="hero-actions">
                <Button
                  className="primary-glow-button"
                  onClick={() => findPitch()}
                  data-testid="hero-browse-arenas-button"
                >
                  Browse arenas <ArrowUpRight size={17} />
                </Button>
                <a href="#how-it-works" className="text-link" data-testid="hero-how-it-works-link">
                  See how it works <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
            <div className="hero-visual" data-testid="hero-visual">
              <button
                ref={crestButtonRef}
                type="button"
                className="hero-image-frame"
                onClick={freezeToTurfs}
                aria-label="Find turfs near me"
                data-testid="hero-crest-button"
              >
                <FreezingCrest src={crestUrl} freeze={freeze} onFrozen={crestFrozen} />
                <span className="image-scanline" aria-hidden="true" />
                <span className="hero-image-label" data-testid="hero-image-label">
                  <span>IR / 001</span>
                  <span className="crest-cta">
                    <LocateFixed size={13} aria-hidden="true" />
                    FIND TURFS NEAR ME
                  </span>
                </span>
              </button>
              <div className="hero-float-card" data-testid="hero-live-card">
                <div className="float-icon">
                  <Crosshair size={17} aria-hidden="true" />
                </div>
                <div>
                  <span>LIVE NOW</span>
                  <strong>{venues.data ? `${venueList.length} arenas online` : "Arenas online"}</strong>
                </div>
              </div>
              <div className="hero-index" data-testid="hero-index-label" aria-hidden="true">
                01 <span>/</span> 04
              </div>
            </div>
          </div>

          {/* Filter Strip */}
          <form
            className="hero-bottom page-frame"
            onSubmit={findPitch}
            aria-label="Find a pitch"
            data-testid="hero-booking-strip"
          >
            <div className="booking-strip-intro">
              <span className="strip-number">01</span>
              <span>
                Find your
                <br />
                next fixture
              </span>
            </div>

            <Select value={activeCity} onValueChange={setActiveCity}>
              <SelectTrigger className="filter-control" aria-label="Play in" data-testid="hero-city-filter">
                <MapPin size={16} aria-hidden="true" />
                <span className="filter-copy">
                  <small>PLAY IN</small>
                  <strong>
                    <SelectValue />
                  </strong>
                </span>
              </SelectTrigger>
              <SelectContent className="filter-menu" position="popper" sideOffset={6} align="start">
                <SelectItem value={ALL}>Any city</SelectItem>
                {cityList.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="filter-control" aria-label="Date" data-testid="hero-date-filter">
                <CalendarDays size={16} aria-hidden="true" />
                <span className="filter-copy">
                  <small>DATE</small>
                  <strong>
                    <SelectValue />
                  </strong>
                </span>
              </SelectTrigger>
              <SelectContent className="filter-menu" position="popper" sideOffset={6} align="start">
                {matchdays.map((day) => (
                  <SelectItem key={day.iso} value={day.iso}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" className="strip-button" data-testid="hero-find-pitch-button">
              Find a pitch <ArrowUpRight size={16} />
            </Button>
          </form>
        </section>

        {/* Network Stats */}
        <section
          className="network-strip page-frame"
          id="network"
          aria-label="The Ice Realm network"
          data-testid="network-stats-section"
        >
          <div className="network-kicker" data-testid="network-kicker">
            THE ICE REALM NETWORK <span>///</span>
          </div>
          <div className="stat">
            <strong data-testid="stat-arenas">
              {venues.data ? twoDigits(venueList.length) : "––"}
              <span>+</span>
            </strong>
            <small>LIVE ARENAS</small>
          </div>
          <div className="stat">
            <strong data-testid="stat-cities">{cities.data ? twoDigits(cityList.length) : "––"}</strong>
            <small>MAJOR CITIES</small>
          </div>
          <div className="stat">
            <strong data-testid="stat-players">
              28K<span>+</span>
            </strong>
            <small>PLAYERS IN THE SQUAD</small>
          </div>
          <div className="network-note" data-testid="network-note">
            <Zap size={15} aria-hidden="true" /> Built for the 90-minute obsession
          </div>
        </section>

        {/* Arenas Section */}
        <section
          className="arenas-section page-frame"
          id="arenas"
          aria-labelledby="arenas-heading"
          data-testid="arenas-section"
        >
          <div className="section-heading-row">
            <div>
              <div className="eyebrow" data-testid="arenas-eyebrow">
                01 / SELECT YOUR TERRITORY
              </div>
              <h2 id="arenas-heading" tabIndex={-1} data-section-heading data-testid="arenas-heading">
                Your next
                <br />
                <em>home ground.</em>
              </h2>
            </div>
            <div
              ref={cityTabsRef}
              className="city-tabs"
              role="group"
              aria-label="Filter arenas by city"
              data-testid="city-tabs"
            >
              {[{ slug: ALL, name: "All arenas" }, ...cityList].map((city) => {
                const isNear = near?.inCoverage && near.citySlug === city.slug;
                return (
                  <button
                    key={city.slug}
                    type="button"
                    className={`city-tab ${activeCity === city.slug ? "is-active" : ""}`}
                    aria-pressed={activeCity === city.slug}
                    onClick={() => setActiveCity(city.slug)}
                    data-testid={`city-filter-${city.slug}-button`}
                  >
                    {isNear && <LocateFixed size={13} aria-hidden="true" />}
                    {city.name}
                    {isNear && <span className="sr-only"> (near you)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="arena-toolbar" data-testid="arena-toolbar">
            <label className="arena-search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search arenas</span>
              <input
                type="search"
                placeholder="Search by arena or area"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                data-testid="arena-search-input"
              />
            </label>
            <div className="format-toggle" role="group" aria-label="Filter by format" data-testid="format-filter">
              {formatFilters.map((format) => (
                <button
                  key={format}
                  type="button"
                  aria-pressed={activeFormat === format}
                  onClick={() => setActiveFormat(format)}
                  data-testid={`format-filter-${format.toLowerCase().replace(/\s+/g, "-")}-button`}
                >
                  {format}
                </button>
              ))}
            </div>
            <p className="arena-count" aria-live="polite" data-testid="arena-count">
              {countLine}
            </p>
          </div>

          {/* Arena Cards Grid */}
          {venues.error ? (
            <div className="arena-empty" role="alert" data-testid="arena-error-state">
              <CloudOff size={22} aria-hidden="true" />
              <h3>Can't load arenas right now</h3>
              <p>{venues.error.message}</p>
              <Button
                className="ghost-button"
                onClick={() => {
                  venues.reload();
                  cities.reload();
                  availability.reload();
                }}
                data-testid="retry-button"
              >
                Try again
              </Button>
            </div>
          ) : !venues.data ? (
            <div className="turf-grid" aria-hidden="true" data-testid="arena-loading">
              {[0, 1, 2].map((placeholder) => (
                <div key={placeholder} className="turf-card is-placeholder" />
              ))}
            </div>
          ) : filteredVenues.length > 0 ? (
            <div className={`turf-grid ${revealing ? "is-revealing" : ""}`} data-testid="turf-grid">
              {filteredVenues.map((venue, index) => (
                <ArenaCard
                  key={venue.id}
                  venue={venue}
                  day={selectedDay}
                  openSlots={openHoursAt(venue)}
                  distanceKm={near?.distances.get(venue.id)}
                  revealIndex={index}
                  onBook={openBooking}
                />
              ))}
            </div>
          ) : (
            <div className="arena-empty" data-testid="arena-empty-state">
              <Snowflake size={22} aria-hidden="true" />
              <h3>No arenas match these filters</h3>
              <p>
                {query.trim() ? `Nothing matches "${query.trim()}"` : "Nothing fits that combination"}
                {activeCity !== ALL ? ` in ${cityName(activeCity)}` : ""}. Try another city or format.
              </p>
              {isFiltered && (
                <Button className="ghost-button" onClick={clearFilters} data-testid="clear-filters-button">
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </section>

        <HowItWorks />
      </main>

      <SiteFooter cities={cityList} onPickCity={pickCity} />

      {bookingVenue && (
        <BookingDialog
          key={bookingSession}
          venue={bookingVenue}
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          matchdays={matchdays}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          openCounts={openCounts}
          onBooked={(booking, phone) => {
            remember(booking, phone);
            availability.reload();
          }}
          onBookingChange={bookingChanged}
          returnFocus={bookingTrigger}
        />
      )}

      <PaymentDialog
        payment={payment}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onChange={bookingChanged}
        returnFocus={fixturesTrigger}
      />

      <FixturesSheet
        open={fixturesOpen}
        onOpenChange={setFixturesOpen}
        fixtures={fixtures}
        phoneFor={phoneFor}
        onPay={payFor}
        onChange={bookingChanged}
        onForget={forget}
        onFind={findBooking}
        onRefresh={refresh}
        onBrowse={() => scrollToSection("arenas")}
        returnFocus={fixturesTrigger}
      />
    </div>
  );
}
