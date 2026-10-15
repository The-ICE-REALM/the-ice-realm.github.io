// Thin fetch wrapper around the Spring Boot API.
// Errors carry the server's ApiError fields so the UI can show its message as-is.

export class ApiError extends Error {
  constructor(code, message, fieldErrors = {}) {
    super(message)
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  let res
  try {
    res = await fetch(path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('OFFLINE', "Can't reach The Ice Realm right now. Check your connection and try again.")
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(
      data?.code ?? 'SERVER_ERROR',
      data?.message ?? 'Something went wrong on our side. Try again in a minute.',
      data?.fieldErrors ?? {},
    )
  }
  return data
}

const admin = (token) => ({ 'X-Admin-Token': token })

export const api = {
  cities: () => request('/api/cities'),
  venues: (city) => request(`/api/cities/${city}/venues`),
  openSlots: (city, date, limit = 6) => request(`/api/cities/${city}/open-slots?date=${date}&limit=${limit}`),
  venue: (id) => request(`/api/venues/${id}`),
  slots: (turfId, date) => request(`/api/turfs/${turfId}/slots?date=${date}`),
  createBooking: (body) => request('/api/bookings', { method: 'POST', body }),
  booking: (ref, phone) => request(`/api/bookings/${ref}?phone=${encodeURIComponent(phone)}`),
  submitUtr: (ref, phone, utr) => request(`/api/bookings/${ref}/utr`, { method: 'POST', body: { phone, utr } }),
  adminBookings: (token, status) => request(`/api/admin/bookings?status=${status}`, { headers: admin(token) }),
  adminConfirm: (token, ref) => request(`/api/admin/bookings/${ref}/confirm`, { method: 'POST', headers: admin(token) }),
  adminReject: (token, ref) => request(`/api/admin/bookings/${ref}/reject`, { method: 'POST', headers: admin(token) }),
}
