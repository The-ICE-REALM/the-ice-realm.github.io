import type { BookingDto, BookingStatus, SlotDto, TurfDto, VenueDto } from "@/types";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatRupees = (amount: number) => rupees.format(amount);

/* ---------- Matchdays ---------- */

export interface Matchday {
  /** yyyy-mm-dd in the player's local time. */
  iso: string;
  /** "Today", "Tomorrow" or the short weekday. */
  short: string;
  /** Two-digit day of the month. */
  day: string;
  /** "Today, 02 Oct" or "Sun, 04 Oct". */
  label: string;
  /** "Friday, 2 October". */
  long: string;
}

const weekdayFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
const monthFormat = new Intl.DateTimeFormat("en-IN", { month: "short" });

/** yyyy-mm-dd in local time (toISOString would shift the date to UTC). */
export function isoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Labels for a yyyy-mm-dd date, with "Today" and "Tomorrow" counted from `now`. */
export function matchday(iso: string, now = new Date()): Matchday {
  const date = parseIso(iso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offset = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  const short = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : weekdayFormat.format(date);
  const day = String(date.getDate()).padStart(2, "0");
  return {
    iso,
    short,
    day,
    label: `${short}, ${day} ${monthFormat.format(date)}`,
    long: date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
  };
}

/** The next `count` days starting today. */
export function upcomingMatchdays(count = 7, from = new Date()): Matchday[] {
  return Array.from({ length: count }, (_, offset) =>
    matchday(isoDate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset)), from)
  );
}

/* ---------- Hours ---------- */

const twelveHour = (hour: number) => (hour % 12 === 0 ? 12 : hour % 12);
const meridiem = (hour: number) => (hour % 24 < 12 ? "am" : "pm");

/** 19 → "7 pm", 24 → "12 am". */
export const hourLabel = (hour: number) => `${twelveHour(hour)} ${meridiem(hour)}`;

/** Closing time as people say it: 24 → "midnight". */
export const closingLabel = (hour: number) => (hour % 24 === 0 ? "midnight" : hourLabel(hour));

/** "7–9 pm", "11 am–1 pm" */
export function hoursLabel(start: number, end: number) {
  return meridiem(start) === meridiem(end)
    ? `${twelveHour(start)}–${twelveHour(end)} ${meridiem(end)}`
    : `${twelveHour(start)} ${meridiem(start)}–${twelveHour(end)} ${meridiem(end)}`;
}

export type SlotPeriod = "Morning" | "Afternoon" | "Under lights";

export function periodOf(hour: number): SlotPeriod {
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Under lights";
}

/** The hours a booking of `length` starting at `start` would take, or null if any of them isn't free. */
export function runFrom(slots: SlotDto[], start: number, length: number): SlotDto[] | null {
  const run = Array.from({ length }, (_, i) => slots.find((slot) => slot.hour === start + i));
  return run.every((slot) => slot?.available) ? (run as SlotDto[]) : null;
}

/* ---------- Grounds ---------- */

/** "Ice Realm Lokhandwala" → "Lokhandwala": the brand is already obvious on the site. */
export const shortName = (name: string) => name.replace(/^Ice Realm\s+/i, "");

/** The ground's cheapest hour across its pitches. */
export const fromPrice = (venue: VenueDto) => Math.min(...venue.turfs.map((turf) => turf.fromPrice));

/** Distinct formats at a ground, e.g. ["7-a-side", "5-a-side"]. */
export const formatsAt = (venue: VenueDto) => [...new Set(venue.turfs.map((turf) => turf.format))];

export const pitchLabel = (turf: TurfDto) => `${turf.name}, ${turf.format}`;

/* ---------- Bookings ---------- */

export const statusLabel: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Waiting for payment",
  PAYMENT_SUBMITTED: "Checking payment",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  EXPIRED: "Hold expired",
};

/** Bookings that still hold their slot. */
export const isActive = (booking: BookingDto) =>
  booking.status === "PENDING_PAYMENT" || booking.status === "PAYMENT_SUBMITTED" || booking.status === "CONFIRMED";

/** When the booked time ends, in local time. */
export function bookingEnd(booking: BookingDto) {
  const end = parseIso(booking.date);
  end.setHours(booking.endHour);
  return end;
}

export const byKickOff = (a: BookingDto, b: BookingDto) => a.date.localeCompare(b.date) || a.startHour - b.startHour;

/** Accepts "98200 12345", "+91 98200 12345" or "098200 12345". Returns the 10 digits, or null. */
export function normaliseMobile(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
