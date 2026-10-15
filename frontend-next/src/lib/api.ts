import type {
  ApiErrorBody,
  BookingDto,
  BookingStatus,
  CityDto,
  CreateBookingRequest,
  NearbyVenueDto,
  OpenCountDto,
  SlotDto,
  VenueDto,
} from "@/types";
import { toast } from "sonner";

/**
 * Where the Java API lives. Empty means the same site (local dev, Go Live, the Docker image); the
 * GitHub Pages build points it at the Render server instead.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
/** Render's free server sleeps when idle; if a request is this slow, say it's waking up. */
const WAKE_NOTICE_MS = 5000;
let wakeNoticeShown = false;

/** An error from the Java API, carrying its code and per-field messages so the UI can show them as-is. */
export class ApiError extends Error {
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(path: string, { method = "GET", body, headers = {} }: RequestOptions = {}): Promise<T> {
  let response: Response;
  const wakeTimer =
    API_BASE && !wakeNoticeShown
      ? window.setTimeout(() => {
          wakeNoticeShown = true;
          toast.info("Waking up the Ice Realm server", {
            description: "This takes up to a minute on the free plan. Hang tight.",
          });
        }, WAKE_NOTICE_MS)
      : undefined;
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("OFFLINE", "Can't reach Ice Realm right now. Check your connection and try again.");
  } finally {
    window.clearTimeout(wakeTimer);
  }
  const data = (await response.json().catch(() => null)) as T | Partial<ApiErrorBody> | null;
  if (!response.ok) {
    const error = (data ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      error.code ?? "SERVER_ERROR",
      error.message ?? "Something went wrong on our side. Try again in a minute.",
      error.fieldErrors ?? {}
    );
  }
  return data as T;
}

const staff = (token: string) => ({ "X-Admin-Token": token });
const query = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();

export const api = {
  cities: () => request<CityDto[]>("/api/cities"),
  venues: () => request<VenueDto[]>("/api/venues"),
  venuesNear: (lat: number, lng: number) => request<NearbyVenueDto[]>(`/api/venues/near?${query({ lat, lng })}`),
  availability: (from: string, days: number) => request<OpenCountDto[]>(`/api/availability?${query({ from, days })}`),
  slots: (turfId: number, date: string) => request<SlotDto[]>(`/api/turfs/${turfId}/slots?${query({ date })}`),

  createBooking: (body: CreateBookingRequest) => request<BookingDto>("/api/bookings", { method: "POST", body }),
  booking: (ref: string, phone: string) =>
    request<BookingDto>(`/api/bookings/${encodeURIComponent(ref)}?${query({ phone })}`),
  submitUtr: (ref: string, phone: string, utr: string) =>
    request<BookingDto>(`/api/bookings/${encodeURIComponent(ref)}/utr`, { method: "POST", body: { phone, utr } }),
  cancelBooking: (ref: string, phone: string) =>
    request<BookingDto>(`/api/bookings/${encodeURIComponent(ref)}/cancel`, { method: "POST", body: { phone } }),

  staffBookings: (token: string, status: BookingStatus) =>
    request<BookingDto[]>(`/api/admin/bookings?${query({ status })}`, { headers: staff(token) }),
  staffConfirm: (token: string, ref: string) =>
    request<BookingDto>(`/api/admin/bookings/${encodeURIComponent(ref)}/confirm`, {
      method: "POST",
      headers: staff(token),
    }),
  staffReject: (token: string, ref: string) =>
    request<BookingDto>(`/api/admin/bookings/${encodeURIComponent(ref)}/reject`, {
      method: "POST",
      headers: staff(token),
    }),
};
