package com.icerealm.service;

import com.icerealm.dto.CreateBookingRequest;
import com.icerealm.dto.Dtos.BookingDto;
import com.icerealm.dto.Dtos.OpenCountDto;
import com.icerealm.dto.SubmitUtrRequest;
import com.icerealm.exception.InvalidBookingException;
import com.icerealm.exception.PaymentVerificationException;
import com.icerealm.exception.ResourceNotFoundException;
import com.icerealm.exception.SlotAlreadyBookedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class BookingServiceTest {

    private static final String PHONE = "9876543210";

    @Autowired
    private BookingService bookings;

    @Autowired
    private SlotService slots;

    private Long turfId;
    private LocalDate tomorrow;
    private int hour;

    /** Each test books on its own turf so tests never collide in the shared database. */
    private static final AtomicLong NEXT_TURF = new AtomicLong(10);

    @BeforeEach
    void pickFreshSlot() {
        turfId = NEXT_TURF.getAndIncrement();
        tomorrow = LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(1);
        hour = 10;
    }

    private CreateBookingRequest request(int startHour, int hours) {
        return new CreateBookingRequest(turfId, tomorrow, startHour, hours, "Sunil", PHONE, null);
    }

    @Test
    void createsAPendingBookingWithUpiLink() {
        BookingDto booking = bookings.create(request(hour, 1));

        assertThat(booking.ref()).matches("IR-[A-Z2-9]{6}");
        assertThat(booking.status()).isEqualTo("PENDING_PAYMENT");
        assertThat(booking.upi().uri()).startsWith("upi://pay?pa=test%40okaxis&pn=The%20Ice%20Realm&am=")
                .contains("&cu=INR").contains(booking.ref());
        assertThat(slots.slotsFor(turfId, tomorrow).stream().filter(s -> s.hour() == hour).findFirst().orElseThrow()
                .available()).isFalse();
    }

    @Test
    void rejectsADoubleBooking() {
        bookings.create(request(hour, 1));

        assertThatThrownBy(() -> bookings.create(request(hour, 1)))
                .isInstanceOf(SlotAlreadyBookedException.class)
                .hasMessageContaining("Pick another slot");
    }

    @Test
    void rejectsAnOverlappingMultiHourBooking() {
        bookings.create(request(hour + 1, 1));

        assertThatThrownBy(() -> bookings.create(request(hour, 2)))
                .isInstanceOf(SlotAlreadyBookedException.class);
    }

    @Test
    void rejectsBookingsPastClosingTime() {
        assertThatThrownBy(() -> bookings.create(request(23, 2)))
                .isInstanceOf(InvalidBookingException.class)
                .hasMessageContaining("Choose a slot inside those hours");
    }

    @Test
    void rejectsBookingsBeyondTheWindow() {
        var req = new CreateBookingRequest(turfId, tomorrow.plusDays(30), 10, 1, "Sunil", PHONE, null);
        assertThatThrownBy(() -> bookings.create(req)).isInstanceOf(InvalidBookingException.class);
    }

    @Test
    void lookupRequiresTheMatchingPhone() {
        BookingDto booking = bookings.create(request(hour, 1));

        assertThat(bookings.find(booking.ref(), PHONE).ref()).isEqualTo(booking.ref());
        assertThatThrownBy(() -> bookings.find(booking.ref(), "9000000000"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void utrThenConfirmMovesBookingToConfirmed() {
        BookingDto booking = bookings.create(request(hour, 1));

        BookingDto submitted = bookings.submitUtr(booking.ref(), new SubmitUtrRequest(PHONE, "123456789012"));
        assertThat(submitted.status()).isEqualTo("PAYMENT_SUBMITTED");

        assertThatThrownBy(() -> bookings.submitUtr(booking.ref(), new SubmitUtrRequest(PHONE, "123456789012")))
                .isInstanceOf(PaymentVerificationException.class);

        assertThat(bookings.confirm(booking.ref()).status()).isEqualTo("CONFIRMED");
    }

    @Test
    void cancellingAnUnpaidHoldFreesItsSlot() {
        BookingDto booking = bookings.create(request(hour, 1));

        assertThat(bookings.cancel(booking.ref(), PHONE).status()).isEqualTo("CANCELLED");
        assertThat(bookings.create(request(hour, 1)).status()).isEqualTo("PENDING_PAYMENT");
    }

    @Test
    void aPaidBookingCannotBeCancelledOnline() {
        BookingDto booking = bookings.create(request(hour, 1));
        bookings.submitUtr(booking.ref(), new SubmitUtrRequest(PHONE, "123456789012"));

        assertThatThrownBy(() -> bookings.cancel(booking.ref(), PHONE))
                .isInstanceOf(InvalidBookingException.class)
                .hasMessageContaining("Call the ground");
    }

    @Test
    void cancellingNeedsTheMatchingPhone() {
        BookingDto booking = bookings.create(request(hour, 1));

        assertThatThrownBy(() -> bookings.cancel(booking.ref(), "9000000000"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void bookingAnHourLowersThatDaysOpenCount() {
        int before = openCount();
        bookings.create(request(hour, 2));

        assertThat(openCount()).isEqualTo(before - 2);
    }

    @Test
    void openCountsStopAtTheEndOfTheBookingWindow() {
        List<OpenCountDto> counts = slots.openCounts(tomorrow, 60);

        assertThat(counts).filteredOn(c -> c.turfId().equals(turfId)).hasSize(13);
    }

    private int openCount() {
        return slots.openCounts(tomorrow, 1).stream()
                .filter(c -> c.turfId().equals(turfId))
                .findFirst().orElseThrow()
                .openSlots();
    }

    @Test
    void rejectingABookingFreesItsSlot() {
        BookingDto booking = bookings.create(request(hour, 1));
        bookings.reject(booking.ref());

        assertThat(bookings.create(request(hour, 1)).status()).isEqualTo("PENDING_PAYMENT");
    }
}
