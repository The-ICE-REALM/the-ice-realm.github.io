package com.icerealm.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Public reference shown to the player and used as the UPI note, e.g. "IR-7KQ4MX". */
    @Column(nullable = false, unique = true)
    private String ref;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Turf turf;

    @Column(nullable = false)
    private LocalDate playDate;

    private int startHour;

    private int hours;

    /** Total price in whole rupees. */
    private int amount;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String phone;

    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING_PAYMENT;

    @Column(nullable = false)
    private Instant createdAt;

    @Embedded
    private Payment payment = new Payment();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookedSlot> slots = new ArrayList<>();

    protected Booking() {
        // required by JPA
    }

    public Booking(String ref, Turf turf, LocalDate playDate, int startHour, int hours, int amount,
                   String customerName, String phone, String email, Instant createdAt) {
        this.ref = ref;
        this.turf = turf;
        this.playDate = playDate;
        this.startHour = startHour;
        this.hours = hours;
        this.amount = amount;
        this.customerName = customerName;
        this.phone = phone;
        this.email = email;
        this.createdAt = createdAt;
        for (int h = startHour; h < startHour + hours; h++) {
            slots.add(new BookedSlot(this, turf, playDate, h));
        }
    }

    public int getEndHour() {
        return startHour + hours;
    }

    public void submitPayment(String utr, Instant at) {
        getPayment().submit(utr, at);
        status = BookingStatus.PAYMENT_SUBMITTED;
    }

    public void confirm(Instant at) {
        getPayment().verify(at);
        status = BookingStatus.CONFIRMED;
    }

    /** Ends the booking and frees its slots for other players. */
    public void release(BookingStatus finalStatus) {
        status = finalStatus;
        slots.clear();
    }

    public Long getId() { return id; }
    public String getRef() { return ref; }
    public Turf getTurf() { return turf; }
    public LocalDate getPlayDate() { return playDate; }
    public int getStartHour() { return startHour; }
    public int getHours() { return hours; }
    public int getAmount() { return amount; }
    public String getCustomerName() { return customerName; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public BookingStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }

    /** Hibernate loads an embeddable whose columns are all null as null, so recreate it on demand. */
    public Payment getPayment() {
        if (payment == null) {
            payment = new Payment();
        }
        return payment;
    }
}
