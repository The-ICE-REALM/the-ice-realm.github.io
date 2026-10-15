// Hand-written boundary mirrors of the Java API's records (backend: com.icerealm.dto).
// Keep these in step with Dtos.java when the backend changes.

export interface CityDto {
  slug: string;
  name: string;
  state: string;
  venueCount: number;
}

export interface TurfDto {
  id: number;
  name: string;
  /** "5-a-side", "7-a-side" or "Futsal". */
  format: string;
  capacity: number;
  dimensions: string;
  description: string;
  /** Cheapest hourly price: a weekday off-peak hour. */
  fromPrice: number;
}

export interface VenueDto {
  id: number;
  slug: string | null;
  name: string;
  citySlug: string;
  cityName: string;
  area: string;
  address: string;
  mapsUrl: string;
  amenities: string[];
  openHour: number;
  closeHour: number;
  photoUrl: string | null;
  rating: number | null;
  highlight: string | null;
  lighting: string | null;
  latitude: number | null;
  longitude: number | null;
  turfs: TurfDto[];
}

export interface NearbyVenueDto {
  venue: VenueDto;
  distanceKm: number;
}

export interface OpenCountDto {
  turfId: number;
  /** yyyy-mm-dd */
  date: string;
  openSlots: number;
}

/** One hour on one turf, e.g. label "7–8 pm". */
export interface SlotDto {
  hour: number;
  label: string;
  price: number;
  band: "Off-peak" | "Peak" | "Weekend";
  available: boolean;
  /** True when the hour has already begun, as opposed to being booked. */
  started: boolean;
}

export type BookingStatus = "PENDING_PAYMENT" | "PAYMENT_SUBMITTED" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export interface UpiDto {
  payeeVpa: string;
  payeeName: string;
  /** upi://pay link with the amount and booking reference filled in. */
  uri: string;
}

export interface BookingDto {
  ref: string;
  status: BookingStatus;
  venueName: string;
  area: string;
  cityName: string;
  turfName: string;
  format: string;
  date: string;
  startHour: number;
  endHour: number;
  timeLabel: string;
  amount: number;
  customerName: string;
  phoneMasked: string;
  createdAt: string;
  /** When an unpaid hold runs out; null once a payment is recorded. */
  holdExpiresAt: string | null;
  utr: string | null;
  upi: UpiDto;
}

export interface CreateBookingRequest {
  turfId: number;
  date: string;
  startHour: number;
  hours: number;
  customerName: string;
  phone: string;
  email: string | null;
}

/** Every error the API returns has this shape. */
export interface ApiErrorBody {
  code: string;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string>;
}
