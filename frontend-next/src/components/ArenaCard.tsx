import type { CSSProperties } from "react";
import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees, formatsAt, fromPrice, shortName, type Matchday } from "@/lib/booking";
import { formatKm } from "@/lib/location";
import { venuePhoto } from "@/lib/photos";
import type { VenueDto } from "@/types";

interface ArenaCardProps {
  venue: VenueDto;
  day: Matchday;
  /** Free hours across the ground's pitches on `day`; undefined while loading. */
  openSlots: number | undefined;
  /** Distance from the customer, once they've shared their location. */
  distanceKm?: number;
  /** Position in the grid, used to stagger the reveal after the crest freezes. */
  revealIndex?: number;
  onBook: (venue: VenueDto) => void;
}

export function ArenaCard({ venue, day, openSlots, distanceKm, revealIndex = 0, onBook }: ArenaCardProps) {
  const name = shortName(venue.name);
  const photo = venuePhoto(venue);
  const when = day.short === "Today" || day.short === "Tomorrow" ? day.short.toLowerCase() : `on ${day.label}`;
  const pitches = venue.turfs.length;

  return (
    <article
      className="turf-card"
      style={{ "--reveal-index": revealIndex } as CSSProperties}
      data-testid={`arena-card-${venue.slug ?? venue.id}`}
    >
      <div className="card-media">
        {photo && <img src={photo} alt="" loading="lazy" decoding="async" />}
        {venue.highlight && (
          <Badge className="card-badge">
            <Sparkles aria-hidden="true" />
            {venue.highlight}
          </Badge>
        )}
      </div>

      <div className="card-body">
        <h3>{name}</h3>
        <p className="card-sub">
          {venue.area}, {venue.cityName} • {formatsAt(venue).join(", ")}
        </p>
        <div className="card-meta">
          <span>
            {distanceKm === undefined
              ? `${pitches} ${pitches === 1 ? "pitch" : "pitches"}`
              : `${formatKm(distanceKm)} away`}
          </span>
          {venue.lighting && <span>{venue.lighting}</span>}
          {venue.rating !== null && (
            <span aria-label={`Rated ${venue.rating.toFixed(1)} out of 5`}>★ {venue.rating.toFixed(1)}</span>
          )}
        </div>

        <p className="card-availability" data-full={openSlots === 0 || undefined}>
          <Clock3 size={15} aria-hidden="true" />
          {openSlots === undefined ? (
            <span>Checking slots…</span>
          ) : openSlots > 0 ? (
            <span>
              <strong>{openSlots}</strong> {openSlots === 1 ? "hour" : "hours"} open {when}
            </span>
          ) : (
            <span>Fully booked {when}. Try another day.</span>
          )}
        </p>

        <div className="card-footer">
          <div className="card-price">
            <small className="card-price-from">from</small>
            <strong>{formatRupees(fromPrice(venue))}</strong>
            <small>/ hour</small>
          </div>
          <Button
            className="primary-glow-button"
            onClick={() => onBook(venue)}
            aria-label={`Lock a slot at ${name}`}
            data-testid={`book-now-${venue.slug ?? venue.id}`}
          >
            Lock slot <ArrowUpRight size={15} />
          </Button>
        </div>
      </div>
    </article>
  );
}
