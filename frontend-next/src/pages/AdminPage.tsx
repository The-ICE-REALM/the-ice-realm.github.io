import { useState, type FormEvent } from "react";
import { ArrowUpRight, LogOut, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BrandLockup } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ApiError, api } from "@/lib/api";
import { formatRupees, matchday, shortName } from "@/lib/booking";
import { useApi } from "@/lib/useApi";
import type { BookingDto, BookingStatus } from "@/types";

const TOKEN_KEY = "iceRealm.staffCode";

const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
};

const tabs: { status: BookingStatus; label: string; empty: string }[] = [
  { status: "PAYMENT_SUBMITTED", label: "To verify", empty: "No payments waiting to be checked." },
  { status: "PENDING_PAYMENT", label: "Awaiting payment", empty: "No unpaid holds right now." },
  { status: "CONFIRMED", label: "Confirmed", empty: "No confirmed bookings yet." },
  { status: "CANCELLED", label: "Cancelled", empty: "Nothing cancelled." },
];

/** Staff screen: match each UTR against the bank statement, then confirm or reject the booking. */
export default function AdminPage() {
  const [token, setToken] = useState(readToken);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<BookingStatus>("PAYMENT_SUBMITTED");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const list = useApi(() => api.staffBookings(token, status), token ? `${status}|${token}` : null);
  const denied = list.error?.code === "ADMIN_ACCESS_DENIED";
  const tab = tabs.find((t) => t.status === status) ?? tabs[0];

  const signIn = (event: FormEvent) => {
    event.preventDefault();
    try {
      sessionStorage.setItem(TOKEN_KEY, draft);
    } catch {
      // Session storage blocked: stay signed in until the tab closes.
    }
    setToken(draft);
    setDraft("");
  };

  const signOut = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing stored.
    }
    setToken("");
  };

  const act = async (booking: BookingDto, action: "confirm" | "reject") => {
    setBusyRef(booking.ref);
    try {
      if (action === "confirm") await api.staffConfirm(token, booking.ref);
      else await api.staffReject(token, booking.ref);
      toast.success(action === "confirm" ? `${booking.ref} confirmed` : `${booking.ref} rejected`, {
        description:
          action === "confirm"
            ? `${booking.customerName}'s ticket is now confirmed.`
            : `${booking.timeLabel} on ${matchday(booking.date).label} is open again.`,
      });
      setRejecting(null);
      list.reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "That didn't work. Try again.");
    } finally {
      setBusyRef(null);
    }
  };

  return (
    <div className="ice-app staff-page">
      <Toaster position="top-center" theme="dark" offset={{ top: 88 }} mobileOffset={{ top: 84 }} />
      <header className="site-header is-solid">
        <div className="header-inner page-frame">
          <BrandLockup home />
          <div className="header-actions">
            {token && !denied && (
              <Button className="ghost-button staff-signout" onClick={signOut}>
                <LogOut size={15} /> Sign out
              </Button>
            )}
            <Link className="text-link" to="/">
              Back to site <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="staff-main page-frame">
        {!token || denied ? (
          <form className="staff-signin" onSubmit={signIn} data-testid="staff-signin">
            <h1>Staff sign-in</h1>
            <p className="section-lede">Check UPI payments against the bank statement and confirm bookings.</p>
            <div className="field" data-invalid={denied ? true : undefined}>
              <label htmlFor="staff-code">Staff code</label>
              <div className="field-input">
                <input
                  id="staff-code"
                  type="password"
                  autoComplete="current-password"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  data-testid="staff-code-input"
                />
              </div>
              {denied && <p className="field-error">{list.error?.message}</p>}
            </div>
            <Button type="submit" className="primary-glow-button" disabled={!draft} data-testid="staff-signin-button">
              Sign in <ArrowUpRight size={16} />
            </Button>
          </form>
        ) : (
          <>
            <div className="staff-head">
              <h1>Payments</h1>
              <Button className="ghost-button" onClick={list.reload} data-testid="staff-refresh">
                <RefreshCw size={15} /> Refresh
              </Button>
            </div>
            <div className="format-toggle staff-tabs" role="group" aria-label="Bookings by status">
              {tabs.map((t) => (
                <button
                  key={t.status}
                  type="button"
                  aria-pressed={status === t.status}
                  onClick={() => {
                    setStatus(t.status);
                    setRejecting(null);
                  }}
                  data-testid={`staff-tab-${t.status}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {list.error && !denied && (
              <p className="field-error" role="alert">
                {list.error.message}
              </p>
            )}
            {list.loading && !list.data && <p className="slot-loading">Loading bookings…</p>}
            {list.data?.length === 0 && <p className="staff-empty">{tab.empty}</p>}

            {list.data && list.data.length > 0 && (
              <ul className="staff-list" data-testid="staff-list">
                {list.data.map((booking) => (
                  <li key={booking.ref} className="staff-row" data-testid={`staff-row-${booking.ref}`}>
                    <div className="staff-cell staff-ref">
                      <strong>{booking.ref}</strong>
                      <span>{formatRupees(booking.amount)}</span>
                    </div>
                    <div className="staff-cell">
                      <strong>{matchday(booking.date).label}</strong>
                      <span>{booking.timeLabel}</span>
                    </div>
                    <div className="staff-cell">
                      <strong>{shortName(booking.venueName)}</strong>
                      <span>
                        {booking.turfName}, {booking.format}
                      </span>
                    </div>
                    <div className="staff-cell">
                      <strong>{booking.customerName}</strong>
                      <span>{booking.phoneMasked}</span>
                    </div>
                    <div className="staff-cell">
                      <strong className="staff-utr">{booking.utr ?? "No UTR yet"}</strong>
                      <span>UTR</span>
                    </div>
                    <div className="staff-actions">
                      {rejecting === booking.ref ? (
                        <>
                          <Button className="ghost-button" onClick={() => setRejecting(null)}>
                            Keep
                          </Button>
                          <Button
                            className="danger-button"
                            disabled={busyRef === booking.ref}
                            onClick={() => act(booking, "reject")}
                            data-testid={`staff-confirm-reject-${booking.ref}`}
                          >
                            Reject and free slot
                          </Button>
                        </>
                      ) : (
                        <>
                          {booking.status === "PAYMENT_SUBMITTED" && (
                            <Button
                              className="primary-glow-button"
                              disabled={busyRef === booking.ref}
                              onClick={() => act(booking, "confirm")}
                              data-testid={`staff-confirm-${booking.ref}`}
                            >
                              Confirm
                            </Button>
                          )}
                          {(booking.status === "PAYMENT_SUBMITTED" || booking.status === "PENDING_PAYMENT") && (
                            <Button
                              className="ghost-button"
                              onClick={() => setRejecting(booking.ref)}
                              data-testid={`staff-reject-${booking.ref}`}
                            >
                              Reject
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
