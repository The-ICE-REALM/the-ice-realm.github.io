import type { ReactNode } from "react";
import { formatRupees, matchday, shortName, statusLabel } from "@/lib/booking";
import type { BookingDto } from "@/types";

interface FixtureTicketProps {
  booking: BookingDto;
  className?: string;
  testId?: string;
  /** Actions shown under the total, such as pay, share or cancel. */
  children?: ReactNode;
}

/** A booking as the player shows it at the gate, with its payment status. */
export function FixtureTicket({ booking, className = "", testId, children }: FixtureTicketProps) {
  const paid = booking.status === "CONFIRMED";

  return (
    <div className={`fixture-ticket ${className}`} data-status={booking.status} data-testid={testId}>
      <div className="ticket-head">
        <span>Booking code</span>
        <span className="ticket-status">{statusLabel[booking.status]}</span>
      </div>
      <p className="ticket-code">{booking.ref}</p>
      <dl className="ticket-rows">
        <div>
          <dt>Ground</dt>
          <dd>
            {shortName(booking.venueName)}, {booking.area}
          </dd>
        </div>
        <div>
          <dt>Pitch</dt>
          <dd>
            {booking.turfName}, {booking.format}
          </dd>
        </div>
        <div>
          <dt>Matchday</dt>
          <dd>{matchday(booking.date).label}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{booking.timeLabel}</dd>
        </div>
        <div>
          <dt>Captain</dt>
          <dd>
            {booking.customerName}, {booking.phoneMasked}
          </dd>
        </div>
      </dl>
      <div className="ticket-perforation" aria-hidden="true" />
      <div className="ticket-total">
        <span>{paid ? "Paid by UPI" : "Total"}</span>
        <strong>{formatRupees(booking.amount)}</strong>
      </div>
      {children}
    </div>
  );
}
