import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { bookingEnd, byKickOff, isActive } from "@/lib/booking";
import { useNow } from "@/lib/useNow";
import type { BookingDto } from "@/types";

const STORAGE_KEY = "iceRealm.bookings";

/** What this browser remembers about a booking: enough to look it up again on the server. */
interface SavedBooking {
  ref: string;
  phone: string;
}

function isSaved(value: unknown): value is SavedBooking {
  if (typeof value !== "object" || value === null) return false;
  const saved = value as Record<string, unknown>;
  return typeof saved.ref === "string" && typeof saved.phone === "string";
}

function readSaved(): SavedBooking[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isSaved) : [];
  } catch {
    return [];
  }
}

/** Looks up every remembered booking. Unknown codes are ones the server no longer has. */
async function lookUpSaved() {
  const saved = readSaved();
  const results = await Promise.allSettled(saved.map((entry) => api.booking(entry.ref, entry.phone)));
  const found: Record<string, BookingDto> = {};
  const unknown = new Set<string>();
  results.forEach((result, i) => {
    if (result.status === "fulfilled") found[saved[i].ref] = result.value;
    else if (result.reason instanceof ApiError && result.reason.code === "NOT_FOUND") unknown.add(saved[i].ref);
  });
  return { found, unknown };
}

function writeSaved(saved: SavedBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage is blocked or full. Bookings still work; they just aren't remembered here.
  }
}

/**
 * The player's bookings. This browser remembers each booking code and mobile number;
 * the bookings themselves, with their payment status, always come from the server.
 */
export function useFixtures() {
  const [saved, setSaved] = useState(readSaved);
  const [bookings, setBookings] = useState<Record<string, BookingDto>>({});

  useEffect(() => writeSaved(saved), [saved]);

  // Keep other open tabs in step.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setSaved(readSaved());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const apply = useCallback(({ found, unknown }: Awaited<ReturnType<typeof lookUpSaved>>) => {
    setBookings((previous) => ({ ...previous, ...found }));
    if (unknown.size) setSaved((list) => list.filter((entry) => !unknown.has(entry.ref)));
  }, []);

  /** Fetches the latest status of every remembered booking, and forgets ones the server no longer knows. */
  const refresh = useCallback(() => lookUpSaved().then(apply), [apply]);

  useEffect(() => {
    let live = true;
    lookUpSaved().then((result) => {
      if (live) apply(result);
    });
    return () => {
      live = false;
    };
  }, [apply]);

  const remember = useCallback((booking: BookingDto, phone: string) => {
    setSaved((list) => [...list.filter((entry) => entry.ref !== booking.ref), { ref: booking.ref, phone }]);
    setBookings((previous) => ({ ...previous, [booking.ref]: booking }));
  }, []);

  const update = useCallback((booking: BookingDto) => {
    setBookings((previous) => ({ ...previous, [booking.ref]: booking }));
  }, []);

  const forget = useCallback((ref: string) => {
    setSaved((list) => list.filter((entry) => entry.ref !== ref));
  }, []);

  const phoneFor = useCallback((ref: string) => saved.find((entry) => entry.ref === ref)?.phone ?? null, [saved]);

  const fixtures = useMemo(
    () =>
      saved
        .map((entry) => bookings[entry.ref])
        .filter((booking): booking is BookingDto => booking !== undefined)
        .sort(byKickOff),
    [saved, bookings]
  );

  // Holding a slot that hasn't been played yet. Re-checked every minute so finished games drop off.
  const now = useNow(60_000);
  const upcoming = fixtures.filter((booking) => isActive(booking) && bookingEnd(booking).getTime() > now);

  return { fixtures, upcoming, remember, update, forget, refresh, phoneFor };
}
