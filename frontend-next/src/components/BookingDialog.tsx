import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { ArrowUpRight, Check, MapPin, Moon, Sun, Sunrise, Zap, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Checkout } from "@/components/Checkout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/api";
import {
  closingLabel,
  formatRupees,
  hourLabel,
  hoursLabel,
  normaliseMobile,
  periodOf,
  runFrom,
  shortName,
  type Matchday,
  type SlotPeriod,
} from "@/lib/booking";
import { venuePhoto } from "@/lib/photos";
import { useApi } from "@/lib/useApi";
import type { BookingDto, SlotDto, VenueDto } from "@/types";

interface BookingDialogProps {
  venue: VenueDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchdays: Matchday[];
  selectedDate: string;
  onDateChange: (iso: string) => void;
  /** Free hours per pitch per day, keyed "turfId|yyyy-mm-dd". */
  openCounts: Map<string, number>;
  onBooked: (booking: BookingDto, phone: string) => void;
  onBookingChange: (booking: BookingDto) => void;
  /** Where keyboard focus goes when the dialog closes: the button that opened it. */
  returnFocus: RefObject<HTMLElement | null>;
}

const periods: { name: SlotPeriod; icon: LucideIcon }[] = [
  { name: "Morning", icon: Sunrise },
  { name: "Afternoon", icon: Sun },
  { name: "Under lights", icon: Moon },
];

const lengths = [1, 2, 3];

type FieldErrors = { slot?: string; captain?: string; mobile?: string; email?: string };
type SlotState = "open" | "booked" | "passed" | "short";

/** Whether a slot can start a booking of the chosen length, and if not, why. */
function slotState(slot: SlotDto, slots: SlotDto[], length: number): SlotState {
  if (!slot.available) return slot.started ? "passed" : "booked";
  return runFrom(slots, slot.hour, length) ? "open" : "short";
}

const stateLabel: Record<SlotState, string> = { open: "", booked: "Booked", passed: "Passed", short: "Too short" };

export function BookingDialog({
  venue,
  open,
  onOpenChange,
  matchdays,
  selectedDate,
  onDateChange,
  openCounts,
  onBooked,
  onBookingChange,
  returnFocus,
}: BookingDialogProps) {
  const [turfId, setTurfId] = useState(venue.turfs[0]?.id);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [length, setLength] = useState(1);
  const [captain, setCaptain] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState<{ booking: BookingDto; phone: string } | null>(null);

  const slotBoardRef = useRef<HTMLDivElement>(null);
  const captainRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const checkoutTitleRef = useRef<HTMLHeadingElement>(null);

  const turf = venue.turfs.find((t) => t.id === turfId) ?? venue.turfs[0];
  const day = matchdays.find((matchday) => matchday.iso === selectedDate) ?? matchdays[0];
  const slots = useApi(() => api.slots(turf.id, day.iso), open && !held ? `${turf.id}|${day.iso}` : null);
  const run = startHour !== null && slots.data ? runFrom(slots.data, startHour, length) : null;
  const total = run?.reduce((sum, slot) => sum + slot.price, 0) ?? 0;
  const name = shortName(venue.name);
  const photo = venuePhoto(venue);

  // Move focus to the payment step's heading when it appears.
  useEffect(() => {
    if (held) checkoutTitleRef.current?.focus();
  }, [held]);

  const clearError = (field: keyof FieldErrors) => setErrors((current) => ({ ...current, [field]: undefined }));

  const choosePitch = (id: number) => {
    setTurfId(id);
    setStartHour(null);
    clearError("slot");
  };

  const chooseDate = (iso: string) => {
    onDateChange(iso);
    setStartHour(null);
    clearError("slot");
  };

  const chooseLength = (hours: number) => {
    setLength(hours);
    // Keep the start time only if a run of the new length still fits there.
    if (startHour !== null && !(slots.data && runFrom(slots.data, startHour, hours))) setStartHour(null);
  };

  const chooseStart = (hour: number) => {
    setStartHour(hour);
    clearError("slot");
  };

  const hold = async (event: FormEvent) => {
    event.preventDefault();

    if (!run) {
      setErrors({ slot: "Pick a start time to continue" });
      toast.error("Pick a start time to continue");
      slotBoardRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
      return;
    }

    const trimmedName = captain.trim();
    const phone = normaliseMobile(mobile);
    const trimmedEmail = email.trim();
    const emailOk = trimmedEmail === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (trimmedName.length < 2 || !phone || !emailOk) {
      setErrors({
        captain: trimmedName.length < 2 ? "Enter the captain's name" : undefined,
        mobile: phone ? undefined : "Enter a 10-digit mobile number",
        email: emailOk ? undefined : "Enter a valid email, or leave it blank",
      });
      (trimmedName.length < 2 ? captainRef : !phone ? mobileRef : emailRef).current?.focus();
      return;
    }

    setBusy(true);
    try {
      const created = await api.createBooking({
        turfId: turf.id,
        date: day.iso,
        startHour: run[0].hour,
        hours: run.length,
        customerName: trimmedName,
        phone,
        email: trimmedEmail || null,
      });
      onBooked(created, phone);
      setHeld({ booking: created, phone });
      toast.success("Slot held for 15 minutes", {
        description: `Pay ${formatRupees(created.amount)} with UPI to confirm it.`,
      });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      if (error.code === "SLOT_ALREADY_BOOKED") {
        toast.error(error.message);
        setStartHour(null);
        slots.reload();
      } else if (error.code === "VALIDATION_FAILED") {
        const fields = error.fieldErrors;
        setErrors({
          captain: fields.customerName,
          mobile: fields.phone,
          email: fields.email,
          slot: fields.startHour ?? fields.hours ?? fields.date ?? fields.turfId,
        });
      } else {
        toast.error(error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="booking-dialog"
        data-testid="booking-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        {held ? (
          <Checkout
            booking={held.booking}
            phone={held.phone}
            titleRef={checkoutTitleRef}
            onChange={(updated) => {
              setHeld({ booking: updated, phone: held.phone });
              onBookingChange(updated);
            }}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <form className="booking-shell" onSubmit={hold} noValidate>
            <div className="booking-scroll">
              <DialogHeader className="booking-head">
                <div className="booking-head-media">{photo && <img src={photo} alt="" />}</div>
                <div>
                  <p className="booking-kicker">
                    <MapPin size={13} aria-hidden="true" />
                    {venue.area}, {venue.cityName}
                  </p>
                  <DialogTitle className="booking-title" data-testid="booking-dialog-title">
                    {name}
                  </DialogTitle>
                  <DialogDescription className="booking-tags">
                    {venue.lighting && <span>{venue.lighting}</span>}
                    {venue.rating !== null && (
                      <span aria-label={`Rated ${venue.rating.toFixed(1)} out of 5`}>★ {venue.rating.toFixed(1)}</span>
                    )}
                    <span>
                      Open {hourLabel(venue.openHour)} to {closingLabel(venue.closeHour)}
                    </span>
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="booking-body">
                <div className="booking-steps">
                  <section aria-labelledby="pitch-heading">
                    <div className="step-head">
                      <span className="step-number">02</span>
                      <h3 id="pitch-heading">Pick your pitch and day</h3>
                    </div>
                    <div className="pitch-rail" role="group" aria-label="Pitch">
                      {venue.turfs.map((pitch) => (
                        <button
                          key={pitch.id}
                          type="button"
                          className="pitch-chip"
                          aria-pressed={pitch.id === turf.id}
                          onClick={() => choosePitch(pitch.id)}
                          data-testid={`pitch-${pitch.id}`}
                        >
                          <strong>{pitch.name}</strong>
                          <span>
                            {pitch.format}, up to {pitch.capacity}
                          </span>
                          <span className="pitch-chip-price">from {formatRupees(pitch.fromPrice)}/hr</span>
                        </button>
                      ))}
                    </div>
                    <div className="date-rail" role="group" aria-label="Matchday">
                      {matchdays.map((matchday) => {
                        const openCount = openCounts.get(`${turf.id}|${matchday.iso}`);
                        const countText =
                          openCount === undefined ? "" : openCount ? `, ${openCount} hours open` : ", fully booked";
                        return (
                          <button
                            key={matchday.iso}
                            type="button"
                            className="date-chip"
                            aria-pressed={matchday.iso === day.iso}
                            aria-label={`${matchday.label}${countText}`}
                            data-full={openCount === 0 || undefined}
                            onClick={() => chooseDate(matchday.iso)}
                            data-testid={`date-chip-${matchday.iso}`}
                          >
                            <span className="date-chip-weekday">{matchday.short}</span>
                            <strong>{matchday.day}</strong>
                            <span className="date-chip-open">
                              {openCount === undefined ? "…" : openCount ? `${openCount} open` : "Full"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section aria-labelledby="slot-heading">
                    <div className="step-head">
                      <span className="step-number">03</span>
                      <h3 id="slot-heading">Lock your hour</h3>
                      <div className="length-toggle" role="group" aria-label="Play for">
                        {lengths.map((hours) => (
                          <button
                            key={hours}
                            type="button"
                            aria-pressed={length === hours}
                            aria-label={`Play for ${hours} ${hours === 1 ? "hour" : "hours"}`}
                            onClick={() => chooseLength(hours)}
                            data-testid={`length-${hours}`}
                          >
                            {hours}h
                          </button>
                        ))}
                      </div>
                    </div>
                    <ul className="slot-legend" aria-label="Key">
                      <li>
                        <i data-swatch="open" />
                        Open
                      </li>
                      <li>
                        <i data-swatch="selected" />
                        Selected
                      </li>
                      <li>
                        <i data-swatch="booked" />
                        Booked
                      </li>
                      <li>
                        <Zap size={12} aria-hidden="true" className="peak-mark" />
                        Peak or weekend rate
                      </li>
                    </ul>

                    <div ref={slotBoardRef} className="slot-board" aria-busy={slots.loading} data-testid="slot-board">
                      {slots.error ? (
                        <p className="field-error" role="alert">
                          {slots.error.message}{" "}
                          <button type="button" className="link-button" onClick={slots.reload}>
                            Try again
                          </button>
                        </p>
                      ) : !slots.data ? (
                        <p className="slot-loading">Checking slots…</p>
                      ) : (
                        periods.map(({ name: period, icon: Icon }) => {
                          const all = slots.data!;
                          const periodSlots = all.filter((slot) => periodOf(slot.hour) === period);
                          if (periodSlots.length === 0) return null;
                          return (
                            <div key={period} className="slot-group" role="group" aria-label={`${period} slots`}>
                              <p className="slot-group-label">
                                <Icon size={14} aria-hidden="true" />
                                {period}
                                <span>{periodSlots.filter((slot) => slot.available).length} open</span>
                              </p>
                              <div className="slot-grid">
                                {periodSlots.map((slot) => {
                                  const state = slotState(slot, all, length);
                                  const inRun = run?.some((hour) => hour.hour === slot.hour) ?? false;
                                  const isStart = run?.[0].hour === slot.hour;
                                  const premium = slot.band !== "Off-peak";
                                  const spoken = inRun
                                    ? "selected"
                                    : state === "open"
                                      ? `${formatRupees(slot.price)}${premium ? `, ${slot.band.toLowerCase()} rate` : ""}`
                                      : stateLabel[state].toLowerCase();
                                  return (
                                    <button
                                      key={slot.hour}
                                      type="button"
                                      className="slot-button"
                                      data-status={inRun ? "selected" : state}
                                      aria-pressed={inRun}
                                      aria-label={`${slot.label}, ${spoken}`}
                                      disabled={state !== "open" && !inRun}
                                      onClick={() => chooseStart(isStart || !inRun ? slot.hour : run![0].hour)}
                                      data-testid={`slot-${slot.hour}`}
                                    >
                                      <span className="slot-time">{hourLabel(slot.hour)}</span>
                                      <span className="slot-state">
                                        {inRun ? (
                                          <>
                                            <Check size={12} strokeWidth={3} aria-hidden="true" />
                                            {isStart ? "Start" : "Selected"}
                                          </>
                                        ) : state === "open" ? (
                                          <>
                                            {premium && <Zap size={11} aria-hidden="true" className="peak-mark" />}
                                            {formatRupees(slot.price)}
                                          </>
                                        ) : (
                                          stateLabel[state]
                                        )}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {errors.slot && (
                      <p className="field-error" role="alert">
                        {errors.slot}
                      </p>
                    )}
                  </section>
                </div>

                <div className="booking-side">
                  <div className="fixture-ticket" data-testid="fixture-ticket">
                    <div className="ticket-head">
                      <span>Your fixture</span>
                      <span>{turf.format}</span>
                    </div>
                    <dl className="ticket-rows">
                      <div>
                        <dt>Matchday</dt>
                        <dd>{day.label}</dd>
                      </div>
                      <div>
                        <dt>Time</dt>
                        <dd data-empty={!run || undefined}>
                          {run ? hoursLabel(run[0].hour, run[0].hour + run.length) : "Pick a start time"}
                        </dd>
                      </div>
                      <div>
                        <dt>Pitch</dt>
                        <dd>
                          {turf.name}, up to {turf.capacity} players
                        </dd>
                      </div>
                    </dl>
                    <div className="ticket-perforation" aria-hidden="true" />
                    <div className="ticket-total">
                      <span>
                        {length} {length === 1 ? "hour" : "hours"}, incl. GST
                      </span>
                      <strong>{run ? formatRupees(total) : "—"}</strong>
                    </div>
                  </div>

                  <div className="captain-fields" role="group" aria-labelledby="captain-heading">
                    <p id="captain-heading" className="captain-heading">
                      Captain details
                    </p>
                    <div className="field" data-invalid={errors.captain ? true : undefined}>
                      <label htmlFor="captain-name">Captain's name</label>
                      <div className="field-input">
                        <input
                          ref={captainRef}
                          id="captain-name"
                          autoComplete="name"
                          maxLength={60}
                          value={captain}
                          onChange={(event) => {
                            setCaptain(event.target.value);
                            clearError("captain");
                          }}
                          aria-invalid={Boolean(errors.captain)}
                          aria-describedby={errors.captain ? "captain-name-error" : undefined}
                          data-testid="captain-name-input"
                        />
                      </div>
                      {errors.captain && (
                        <p id="captain-name-error" className="field-error">
                          {errors.captain}
                        </p>
                      )}
                    </div>
                    <div className="field" data-invalid={errors.mobile ? true : undefined}>
                      <label htmlFor="captain-mobile">Mobile number</label>
                      <div className="field-input">
                        <span className="field-prefix" aria-hidden="true">
                          +91
                        </span>
                        <input
                          ref={mobileRef}
                          id="captain-mobile"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          placeholder="98200 12345"
                          value={mobile}
                          onChange={(event) => {
                            // Keep digits only, and drop a pasted +91 country code.
                            const digits = event.target.value.replace(/\D/g, "");
                            setMobile(
                              digits.length > 10 && digits.startsWith("91") ? digits.slice(2, 12) : digits.slice(0, 10)
                            );
                            clearError("mobile");
                          }}
                          aria-invalid={Boolean(errors.mobile)}
                          aria-describedby={errors.mobile ? "captain-mobile-error" : "captain-mobile-hint"}
                          data-testid="captain-mobile-input"
                        />
                      </div>
                      {errors.mobile ? (
                        <p id="captain-mobile-error" className="field-error">
                          {errors.mobile}
                        </p>
                      ) : (
                        <p id="captain-mobile-hint" className="field-hint">
                          You'll need it to look up this booking.
                        </p>
                      )}
                    </div>
                    <div className="field" data-invalid={errors.email ? true : undefined}>
                      <label htmlFor="captain-email">
                        Email <span className="field-optional">optional</span>
                      </label>
                      <div className="field-input">
                        <input
                          ref={emailRef}
                          id="captain-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            clearError("email");
                          }}
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? "captain-email-error" : undefined}
                          data-testid="captain-email-input"
                        />
                      </div>
                      {errors.email && (
                        <p id="captain-email-error" className="field-error">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="booking-actions">
              <div className="booking-actions-summary" aria-live="polite">
                <strong>{run ? hoursLabel(run[0].hour, run[0].hour + run.length) : "No slot yet"}</strong>
                <span>{run ? `${day.label}, ${turf.name}` : "Pick an open hour"}</span>
              </div>
              <div className="booking-actions-total">
                <small>Total</small>
                <strong>{run ? formatRupees(total) : "—"}</strong>
              </div>
              <Button
                type="submit"
                className="primary-glow-button booking-submit"
                disabled={busy}
                data-testid="booking-confirm-button"
              >
                {busy ? "Holding…" : "Hold slot"} {!busy && <ArrowUpRight size={16} />}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
