import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import QRCode from "qrcode";
import { Check, Copy, Share2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { FixtureTicket } from "@/components/FixtureTicket";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/api";
import { formatRupees } from "@/lib/booking";
import { shareFixture } from "@/lib/share";
import { useNow } from "@/lib/useNow";
import type { BookingDto } from "@/types";

interface CheckoutProps {
  booking: BookingDto;
  /** The mobile number the booking was made with; the API asks for it to prove it's theirs. */
  phone: string;
  onChange: (booking: BookingDto) => void;
  onClose: () => void;
  titleRef?: RefObject<HTMLHeadingElement | null>;
}

const onPhone = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const countdown = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/** Paying for a held slot with UPI, then following the booking until staff confirm it. */
export function Checkout({ booking, phone, onChange, onClose, titleRef }: CheckoutProps) {
  const { status } = booking;
  const now = useNow(1000, status === "PENDING_PAYMENT");
  const msLeft = booking.holdExpiresAt ? new Date(booking.holdExpiresAt).getTime() - now : 0;
  const holdOver = status === "EXPIRED" || (status === "PENDING_PAYMENT" && msLeft <= 0);

  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  // While staff match the payment, check for their answer every 10 seconds.
  useEffect(() => {
    if (status !== "PAYMENT_SUBMITTED") return;
    const timer = window.setInterval(() => {
      api.booking(booking.ref, phone).then(
        (latest) => latest.status !== "PAYMENT_SUBMITTED" && onChangeRef.current(latest),
        () => undefined
      );
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [status, booking.ref, phone]);

  let step = "Pay with UPI";
  let title = "Pay to lock it in";
  let description: ReactNode = (
    <>
      We're holding {booking.timeLabel} for you for <strong className="hold-clock">{countdown(msLeft)}</strong>. Pay{" "}
      {formatRupees(booking.amount)} with any UPI app, then send us the UTR so we can confirm it.
    </>
  );
  if (holdOver) {
    title = "Your hold ran out";
    description = "No payment came in within 15 minutes, so the slot was released. Book again if it's still free.";
  } else if (status === "PAYMENT_SUBMITTED") {
    title = "Payment sent";
    description = (
      <>
        We're matching UTR <strong>{booking.utr}</strong> with the bank. This updates by itself, usually within a few
        minutes. You'll also find it in My fixtures.
      </>
    );
  } else if (status === "CONFIRMED") {
    step = "Kick off";
    title = "You're on the pitch";
    description = (
      <>
        Show code <strong>{booking.ref}</strong> at the gate. Arrive 10 minutes early to change and warm up.
      </>
    );
  } else if (status === "CANCELLED") {
    title = "Booking cancelled";
    description = "This booking was cancelled. If money left your account, call the ground with your UTR.";
  }

  return (
    <div className="booking-shell">
      <div className="booking-scroll">
        <div className="checkout" data-status={holdOver ? "EXPIRED" : status} data-testid="checkout">
          <div className="checkout-main">
            {status === "CONFIRMED" && (
              <span className="confirm-emblem" aria-hidden="true">
                <Check size={28} strokeWidth={2.6} />
              </span>
            )}
            <p className="confirm-step">
              <span className="step-number">04</span> {step}
            </p>
            <DialogTitle ref={titleRef} tabIndex={-1} className="booking-title confirm-title">
              {title}
            </DialogTitle>
            <DialogDescription className="confirm-desc" data-testid="checkout-description">
              {description}
            </DialogDescription>

            {status === "PENDING_PAYMENT" && !holdOver && (
              <>
                <UpiPanel booking={booking} />
                <UtrForm booking={booking} phone={phone} onSent={onChange} />
              </>
            )}
          </div>
          <FixtureTicket booking={booking} className="is-issued" testId="booking-ticket" />
        </div>
      </div>

      <div className="booking-actions is-confirmed">
        {status === "CONFIRMED" && (
          <Button type="button" className="ghost-button" onClick={() => shareFixture(booking)}>
            <Share2 size={16} /> Share with squad
          </Button>
        )}
        <Button
          type="button"
          className="primary-glow-button booking-submit"
          onClick={onClose}
          data-testid="checkout-close-button"
        >
          {status === "PENDING_PAYMENT" && !holdOver ? "Pay later" : "Done"}
        </Button>
      </div>
    </div>
  );
}

function UpiPanel({ booking }: { booking: BookingDto }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { upi } = booking;

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(upi.uri, { width: 360, margin: 1, color: { dark: "#041019", light: "#ffffff" } }).then(
      (url) => live && setQr(url),
      () => live && setQr(null)
    );
    return () => {
      live = false;
    };
  }, [upi.uri]);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upi.payeeVpa);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; the ID is on screen to copy by hand.
    }
  };

  return (
    <div className="upi-panel">
      <div className="upi-qr">
        {qr ? (
          <img
            src={qr}
            alt={`UPI QR code to pay ${formatRupees(booking.amount)} to ${upi.payeeName}`}
            width={168}
            height={168}
            data-testid="upi-qr"
          />
        ) : (
          <span className="upi-qr-wait">Making QR code…</span>
        )}
      </div>
      <div className="upi-side">
        <a className="primary-glow-button upi-pay" href={upi.uri} data-testid="upi-pay-link">
          <Smartphone size={16} aria-hidden="true" />
          Pay {formatRupees(booking.amount)} with UPI
        </a>
        <p className="field-hint">
          {onPhone() ? "Opens GPay, PhonePe or any UPI app." : "On a computer? Scan the QR code with your phone."}
        </p>
        <dl className="upi-details">
          <div>
            <dt>Pay to</dt>
            <dd>{upi.payeeName}</dd>
          </div>
          <div>
            <dt>UPI ID</dt>
            <dd>
              {upi.payeeVpa}
              <button type="button" className="link-button" onClick={copyUpiId}>
                {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
          <div>
            <dt>Note</dt>
            <dd>Ice Realm {booking.ref}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function UtrForm({ booking, phone, onSent }: { booking: BookingDto; phone: string; onSent: (b: BookingDto) => void }) {
  const [utr, setUtr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (utr.length !== 12) {
      setError("The UTR is the 12-digit number on your UPI receipt.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api.submitUtr(booking.ref, phone, utr);
      toast.success("Payment sent for checking", { description: "We'll confirm it shortly." });
      onSent(updated);
    } catch (err) {
      setError(err instanceof ApiError ? (err.fieldErrors.utr ?? err.message) : "Couldn't send the UTR. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="utr-form" onSubmit={send} noValidate>
      <div className="field" data-invalid={error ? true : undefined}>
        <label htmlFor="utr-input">UTR number</label>
        <div className="field-input">
          <input
            id="utr-input"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            placeholder="12 digits"
            value={utr}
            onChange={(event) => {
              setUtr(event.target.value.replace(/\D/g, "").slice(0, 12));
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby="utr-hint"
            data-testid="utr-input"
          />
        </div>
        <p id="utr-hint" className={error ? "field-error" : "field-hint"}>
          {error ?? "After paying, open the payment in your UPI app and copy its UPI transaction ID."}
        </p>
      </div>
      <Button type="submit" className="ghost-button utr-submit" disabled={busy} data-testid="utr-submit">
        {busy ? "Sending…" : "I've paid, send UTR"}
      </Button>
    </form>
  );
}
