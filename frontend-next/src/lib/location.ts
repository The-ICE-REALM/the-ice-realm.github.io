import type { NearbyVenueDto, VenueDto } from "@/types";

/** Farther than this from every ground, the customer isn't in an Ice Realm city. */
const COVERAGE_KM = 60;

export interface LatLng {
  lat: number;
  lng: number;
}

/** "3.1 km" up close, "340 km" farther out. */
export const formatKm = (km: number) =>
  km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString("en-IN")} km`;

/**
 * Asks the browser where the customer is. The position is only sent to Ice Realm's own API,
 * to sort grounds by distance. Gives up after `timeoutMs`, including time the permission prompt stays open.
 */
export function locateCustomer(timeoutMs = 10_000): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation isn't available in this browser."));
      return;
    }
    const timer = window.setTimeout(() => reject(new Error("Location timed out.")), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 10 * 60_000 }
    );
  });
}

export const isPermissionDenied = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === 1;

export interface NearYou {
  citySlug: string;
  cityName: string;
  nearest: VenueDto;
  km: number;
  /** False when the customer is far from every Ice Realm city. */
  inCoverage: boolean;
  /** Distance to every ground, by venue id. */
  distances: Map<number, number>;
}

/** Sums up the API's nearest-first list: which city to show, and how far each ground is. */
export function nearYou(nearby: NearbyVenueDto[]): NearYou | null {
  const [first] = nearby;
  if (!first) return null;
  return {
    citySlug: first.venue.citySlug,
    cityName: first.venue.cityName,
    nearest: first.venue,
    km: first.distanceKm,
    inCoverage: first.distanceKm <= COVERAGE_KM,
    distances: new Map(nearby.map((entry) => [entry.venue.id, entry.distanceKm])),
  };
}
