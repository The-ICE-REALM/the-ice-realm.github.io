package com.icerealm.model;

public enum BookingStatus {
    /** Slot is held; waiting for the player to pay by UPI. */
    PENDING_PAYMENT,
    /** Player has entered a UTR; waiting for staff to match it. */
    PAYMENT_SUBMITTED,
    CONFIRMED,
    CANCELLED,
    /** Hold ran out before any payment was submitted. */
    EXPIRED;

    /** Whether a booking in this status still blocks its slots. */
    public boolean holdsSlots() {
        return this == PENDING_PAYMENT || this == PAYMENT_SUBMITTED || this == CONFIRMED;
    }
}
