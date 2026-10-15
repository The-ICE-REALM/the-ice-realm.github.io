package com.icerealm.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;

/**
 * One hour of one turf that is held by a booking.
 *
 * <p>The unique constraint is the last line of defence against double
 * booking: even if two requests race past the service-level check, the
 * database rejects the second insert.
 */
@Entity
@Table(uniqueConstraints = @UniqueConstraint(
        name = "uk_turf_date_hour", columnNames = {"turf_id", "play_date", "slot_hour"}))
public class BookedSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Turf turf;

    @Column(name = "play_date", nullable = false)
    private LocalDate playDate;

    @Column(name = "slot_hour", nullable = false)
    private int slotHour;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Booking booking;

    protected BookedSlot() {
        // required by JPA
    }

    BookedSlot(Booking booking, Turf turf, LocalDate playDate, int hour) {
        this.booking = booking;
        this.turf = turf;
        this.playDate = playDate;
        this.slotHour = hour;
    }

    public Long getId() { return id; }
    public Turf getTurf() { return turf; }
    public LocalDate getPlayDate() { return playDate; }
    public int getHour() { return slotHour; }
    public Booking getBooking() { return booking; }
}
