package com.icerealm.service;

import com.icerealm.config.AppProperties;
import com.icerealm.dto.CreateBookingRequest;
import com.icerealm.dto.Dtos.BookingDto;
import com.icerealm.dto.SubmitUtrRequest;
import com.icerealm.exception.InvalidBookingException;
import com.icerealm.exception.PaymentVerificationException;
import com.icerealm.exception.ResourceNotFoundException;
import com.icerealm.exception.SlotAlreadyBookedException;
import com.icerealm.model.Booking;
import com.icerealm.model.BookingStatus;
import com.icerealm.model.Turf;
import com.icerealm.model.Venue;
import com.icerealm.pricing.PricingService;
import com.icerealm.repository.BookedSlotRepository;
import com.icerealm.repository.BookingRepository;
import com.icerealm.repository.TurfRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class BookingService {

    /** No 0/O or 1/I, so refs are easy to read out over the phone. */
    private static final String REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final BookingRepository bookings;
    private final BookedSlotRepository bookedSlots;
    private final TurfRepository turfs;
    private final SlotService slotService;
    private final PricingService pricing;
    private final PaymentService payments;
    private final AppProperties props;
    private final Clock clock;

    public BookingService(BookingRepository bookings, BookedSlotRepository bookedSlots, TurfRepository turfs,
                          SlotService slotService, PricingService pricing, PaymentService payments,
                          AppProperties props, Clock clock) {
        this.bookings = bookings;
        this.bookedSlots = bookedSlots;
        this.turfs = turfs;
        this.slotService = slotService;
        this.pricing = pricing;
        this.payments = payments;
        this.props = props;
        this.clock = clock;
    }

    /**
     * Holds the requested hours and returns a booking awaiting payment.
     *
     * @throws ResourceNotFoundException  if the turf doesn't exist
     * @throws InvalidBookingException    if the slot is in the past, outside opening hours or too far ahead
     * @throws SlotAlreadyBookedException if any of the hours is already held
     */
    @Transactional
    public BookingDto create(CreateBookingRequest req) {
        Turf turf = turfs.findWithVenueById(req.turfId())
                .orElseThrow(() -> new ResourceNotFoundException("That turf doesn't exist."));
        validateTiming(turf.getVenue(), req);

        Set<Integer> taken = Set.copyOf(bookedSlots.findTakenHours(turf.getId(), req.date()));
        for (int h = req.startHour(); h < req.startHour() + req.hours(); h++) {
            if (taken.contains(h)) {
                throw new SlotAlreadyBookedException(TimeLabels.range(h, h + 1));
            }
        }

        int amount = pricing.priceFor(turf, req.date(), req.startHour(), req.hours());
        Booking booking = new Booking(newRef(), turf, req.date(), req.startHour(), req.hours(), amount,
                req.customerName().trim(), req.phone(), blankToNull(req.email()), clock.instant());
        // saveAndFlush makes a racing duplicate fail here, inside this method,
        // where the unique key violation becomes a SlotAlreadyBookedException.
        bookings.saveAndFlush(booking);
        return toDto(booking);
    }

    @Transactional(readOnly = true)
    public BookingDto find(String ref, String phone) {
        return toDto(findOwned(ref, phone));
    }

    /**
     * Records the UTR the player copied from GPay. Staff then match it against
     * the bank statement and confirm.
     */
    @Transactional
    public BookingDto submitUtr(String ref, SubmitUtrRequest req) {
        Booking booking = findOwned(ref, req.phone());
        if (booking.getStatus() == BookingStatus.EXPIRED) {
            throw new PaymentVerificationException(
                    "This hold ran out and the slot was released. Book again, and if you already paid, "
                            + "call the ground with your UTR for a refund.");
        }
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new PaymentVerificationException("A payment has already been recorded for this booking.");
        }
        booking.submitPayment(req.utr(), clock.instant());
        return toDto(booking);
    }

    /**
     * Gives back a hold the player hasn't paid for, so the slot opens up again.
     * Once a payment is recorded, staff handle cancellation so refunds are tracked.
     */
    @Transactional
    public BookingDto cancel(String ref, String phone) {
        Booking booking = findOwned(ref, phone);
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new InvalidBookingException(booking.getStatus().holdsSlots()
                    ? "This booking has a payment against it, so it can't be cancelled online. "
                            + "Call the ground to cancel and arrange a refund."
                    : "This booking has already ended, so there's nothing to cancel.");
        }
        booking.release(BookingStatus.CANCELLED);
        return toDto(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> listByStatus(BookingStatus status) {
        return bookings.findByStatusOrderByCreatedAtAsc(status).stream().map(this::toDto).toList();
    }

    @Transactional
    public BookingDto confirm(String ref) {
        Booking booking = findByRef(ref);
        if (booking.getStatus() != BookingStatus.PAYMENT_SUBMITTED) {
            throw new PaymentVerificationException("Only bookings with a submitted UTR can be confirmed.");
        }
        booking.confirm(clock.instant());
        return toDto(booking);
    }

    @Transactional
    public BookingDto reject(String ref) {
        Booking booking = findByRef(ref);
        if (!booking.getStatus().holdsSlots() || booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new PaymentVerificationException("Only unconfirmed bookings can be rejected.");
        }
        booking.release(BookingStatus.CANCELLED);
        return toDto(booking);
    }

    /** Releases holds that were never paid for. Returns how many were expired. */
    @Transactional
    public int expireStaleHolds() {
        Instant cutoff = clock.instant().minus(Duration.ofMinutes(props.holdMinutes()));
        List<Booking> stale = bookings.findByStatusAndCreatedAtBefore(BookingStatus.PENDING_PAYMENT, cutoff);
        stale.forEach(b -> b.release(BookingStatus.EXPIRED));
        return stale.size();
    }

    private void validateTiming(Venue venue, CreateBookingRequest req) {
        slotService.checkWithinWindow(req.date());
        int end = req.startHour() + req.hours();
        if (!venue.isOpenAt(req.startHour()) || end > venue.getCloseHour()) {
            throw new InvalidBookingException(venue.getName() + " is open " + TimeLabels.hour(venue.getOpenHour())
                    + " to " + TimeLabels.hour(venue.getCloseHour()) + ". Choose a slot inside those hours.");
        }
        if (slotService.hasStarted(req.date(), req.startHour())) {
            throw new InvalidBookingException("That slot has already started. Choose a later one.");
        }
    }

    private Booking findByRef(String ref) {
        return bookings.findByRef(ref.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("No booking found with reference " + ref + "."));
    }

    /** Looks up a booking only if the phone matches, so refs alone can't reveal other players' bookings. */
    private Booking findOwned(String ref, String phone) {
        Booking booking = bookings.findByRef(ref.toUpperCase()).orElse(null);
        if (booking == null || phone == null || !booking.getPhone().equals(phone.trim())) {
            throw new ResourceNotFoundException(
                    "No booking matches that reference and mobile number. Check both and try again.");
        }
        return booking;
    }

    private String newRef() {
        String ref;
        do {
            StringBuilder sb = new StringBuilder("IR-");
            for (int i = 0; i < 6; i++) {
                sb.append(REF_ALPHABET.charAt(RANDOM.nextInt(REF_ALPHABET.length())));
            }
            ref = sb.toString();
        } while (bookings.existsByRef(ref));
        return ref;
    }

    private BookingDto toDto(Booking b) {
        Turf t = b.getTurf();
        Venue v = t.getVenue();
        Instant holdExpiresAt = b.getStatus() == BookingStatus.PENDING_PAYMENT
                ? b.getCreatedAt().plus(Duration.ofMinutes(props.holdMinutes()))
                : null;
        return new BookingDto(b.getRef(), b.getStatus().name(), v.getName(), v.getArea(), v.getCity().getName(),
                t.getName(), t.getFormat(), b.getPlayDate(), b.getStartHour(), b.getEndHour(),
                TimeLabels.range(b.getStartHour(), b.getEndHour()), b.getAmount(), b.getCustomerName(),
                maskPhone(b.getPhone()), b.getCreatedAt(), holdExpiresAt, b.getPayment().getUtr(),
                payments.upiFor(b));
    }

    private static String maskPhone(String phone) {
        return "••••••" + phone.substring(phone.length() - 4);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
