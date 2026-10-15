import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { ArrowUpRight, Share2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { FixtureTicket } from "@/components/FixtureTicket";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ApiError, api } from "@/lib/api";
import { bookingEnd, isActive, matchday, normaliseMobile, shortName } from "@/lib/booking";
import { shareFixture } from "@/lib/share";
import { useNow } from "@/lib/useNow";
import type { BookingDto } from "@/types";

interface FixturesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixtures: BookingDto[];
  phoneFor: (ref: string) => string | null;
  /** Opens payment for a held booking. */
  onPay: (booking: BookingDto) => void;
  onChange: (booking: BookingDto) => void;
  onForget: (ref: string) => void;
  /** Looks a booking up by code and mobile, and adds it to this device. Throws ApiError if not found. */
  onFind: (ref: string, phone: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  /** Runs once the sheet has closed after "Browse arenas", so the page can scroll freely. */
  onBrowse: () => void;
  /** Where keyboard focus goes when the sheet closes: the control that opened it. */
  returnFocus: RefObject<HTMLElement | null>;
}

export function FixturesSheet({
  open,
  onOpenChange,
  fixtures,
  phoneFor,
  onPay,
  onChange,
  onForget,
  onFind,
  onRefresh,
  onBrowse,
  returnFocus,
}: FixturesSheetProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cancelButtons = useRef(new Map<string, HTMLButtonElement>());
  const browsing = useRef(false);
  const now = useNow(30_000, open);
  const live = fixtures.filter((booking) => isActive(booking) && bookingEnd(booking).getTime() > now);
  const ended = fixtures.filter((booking) => !live.includes(booking));

  // While staff are checking a payment, keep the statuses fresh.
  const refreshRef = useRef(onRefresh);
  useLayoutEffect(() => {
    refreshRef.current = onRefresh;
  });
  const checking = open && fixtures.some((booking) => booking.status === "PAYMENT_SUBMITTED");
  useEffect(() => {
    if (!checking) return;
    const timer = window.setInterval(() => void refreshRef.current(), 15_000);
    return () => window.clearInterval(timer);
  }, [checking]);

  const changeOpen = (next: boolean) => {
    if (!next) setConfirming(null);
    onOpenChange(next);
  };

  const keep = (ref: string) => {
    setConfirming(null);
    requestAnimationFrame(() => cancelButtons.current.get(ref)?.focus());
  };

  const cancelHold = async (booking: BookingDto) => {
    const phone = phoneFor(booking.ref);
    if (!phone) return;
    try {
      const cancelled = await api.cancelBooking(booking.ref, phone);
      onChange(cancelled);
      setConfirming(null);
      const freed = `${shortName(booking.venueName)}, ${matchday(booking.date).label} at ${booking.timeLabel}`;
      // Toasts sit outside the sheet and are hidden from screen readers while it's open, so announce here too.
      setAnnouncement(`Hold ${booking.ref} cancelled. ${freed} is open again.`);
      toast.success("Hold cancelled", { description: `${freed} is open again.` });
      titleRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't cancel the hold. Try again.");
    }
  };

  const browse = () => {
    browsing.current = true;
    changeOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetContent
        className="fixtures-sheet"
        data-testid="fixtures-sheet"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (browsing.current) {
            browsing.current = false;
            onBrowse();
            return;
          }
          // A mobile menu item that opened the sheet is hidden by now, so fall back to the header button.
          const target = returnFocus.current;
          const visible = target?.isConnected && target.getClientRects().length > 0;
          (visible ? target : document.querySelector<HTMLElement>('[data-testid="header-fixtures-button"]'))?.focus();
        }}
      >
        <SheetHeader className="fixtures-head">
          <SheetTitle ref={titleRef} tabIndex={-1} className="fixtures-title">
            My fixtures
          </SheetTitle>
          <SheetDescription className="fixtures-desc">
            {live.length
              ? `${live.length} ${live.length === 1 ? "booking" : "bookings"} coming up. Show the code at the gate.`
              : "Bookings you make on this device show up here."}
          </SheetDescription>
        </SheetHeader>

        <div className="fixtures-list">
          {fixtures.length === 0 && (
            <div className="fixtures-empty" data-testid="fixtures-empty">
              <Ticket size={22} aria-hidden="true" />
              <h3>No fixtures yet</h3>
              <p>Hold a slot at any arena and it shows up here, with the code you show at the gate.</p>
              <Button className="primary-glow-button" onClick={browse} data-testid="fixtures-browse-button">
                Browse arenas <ArrowUpRight size={16} />
              </Button>
            </div>
          )}

          {[...live, ...ended].map((booking) => (
            <FixtureTicket key={booking.ref} booking={booking} testId={`fixture-${booking.ref}`}>
              {confirming === booking.ref ? (
                <div className="ticket-confirm" role="group" aria-labelledby={`confirm-${booking.ref}`}>
                  <p id={`confirm-${booking.ref}`}>Cancel this hold? The slot opens up for other squads.</p>
                  <div className="ticket-actions">
                    <Button className="ghost-button" onClick={() => keep(booking.ref)} autoFocus>
                      Keep it
                    </Button>
                    <Button
                      className="danger-button"
                      onClick={() => cancelHold(booking)}
                      data-testid={`fixture-confirm-cancel-${booking.ref}`}
                    >
                      Cancel hold
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="ticket-actions">
                  {booking.status === "PENDING_PAYMENT" && live.includes(booking) && (
                    <>
                      <Button
                        className="primary-glow-button"
                        onClick={() => onPay(booking)}
                        data-testid={`fixture-pay-${booking.ref}`}
                      >
                        Pay now
                      </Button>
                      <Button
                        ref={(element) => {
                          if (!element) return;
                          cancelButtons.current.set(booking.ref, element);
                          return () => {
                            cancelButtons.current.delete(booking.ref);
                          };
                        }}
                        className="ghost-button"
                        onClick={() => setConfirming(booking.ref)}
                        data-testid={`fixture-cancel-${booking.ref}`}
                      >
                        Cancel hold
                      </Button>
                    </>
                  )}
                  {booking.status === "PAYMENT_SUBMITTED" && (
                    <p className="ticket-note">We're matching your UTR with the bank. This updates by itself.</p>
                  )}
                  {(booking.status === "CONFIRMED" || booking.status === "PAYMENT_SUBMITTED") &&
                    live.includes(booking) && (
                      <Button className="ghost-button" onClick={() => shareFixture(booking)}>
                        <Share2 size={15} /> Share
                      </Button>
                    )}
                  {!live.includes(booking) && (
                    <Button
                      className="ghost-button"
                      onClick={() => onForget(booking.ref)}
                      data-testid={`fixture-remove-${booking.ref}`}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </FixtureTicket>
          ))}

          <FindBooking onFind={onFind} />
        </div>

        <p className="sr-only" role="status">
          {announcement}
        </p>
      </SheetContent>
    </Sheet>
  );
}

/** Adds a booking made on another device, by its code and mobile number. */
function FindBooking({ onFind }: { onFind: (ref: string, phone: string) => Promise<void> }) {
  const [ref, setRef] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const find = async (event: FormEvent) => {
    event.preventDefault();
    const code = ref.trim().toUpperCase();
    const phone = normaliseMobile(mobile);
    if (!/^IR-[A-Z0-9]{6}$/.test(code) || !phone) {
      setError(phone ? "Booking codes look like IR-7KQ4MX." : "Enter the 10-digit mobile number you booked with.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onFind(code, phone);
      setRef("");
      setMobile("");
      toast.success("Booking added", { description: `${code} is now in My fixtures.` });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't look that booking up. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="find-booking" onSubmit={find} noValidate aria-labelledby="find-booking-heading">
      <p id="find-booking-heading" className="captain-heading">
        Booked on another phone?
      </p>
      <div className="find-booking-fields">
        <div className="field-input">
          <input
            aria-label="Booking code"
            placeholder="IR-XXXXXX"
            autoCapitalize="characters"
            value={ref}
            onChange={(event) => setRef(event.target.value)}
            data-testid="find-booking-code"
          />
        </div>
        <div className="field-input">
          <input
            aria-label="Mobile number you booked with"
            type="tel"
            inputMode="numeric"
            placeholder="Mobile number"
            value={mobile}
            onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
            data-testid="find-booking-mobile"
          />
        </div>
        <Button type="submit" className="ghost-button" disabled={busy} data-testid="find-booking-submit">
          {busy ? "Finding…" : "Add booking"}
        </Button>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
