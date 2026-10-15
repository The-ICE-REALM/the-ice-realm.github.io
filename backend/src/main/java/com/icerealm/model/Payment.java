package com.icerealm.model;

import jakarta.persistence.Embeddable;

import java.time.Instant;

/** UPI payment details stored alongside a booking. */
@Embeddable
public class Payment {

    /** 12-digit UPI transaction reference the player copies from GPay. */
    private String utr;

    private Instant submittedAt;

    private Instant verifiedAt;

    public void submit(String utr, Instant at) {
        this.utr = utr;
        this.submittedAt = at;
    }

    public void verify(Instant at) {
        this.verifiedAt = at;
    }

    public String getUtr() { return utr; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getVerifiedAt() { return verifiedAt; }
}
