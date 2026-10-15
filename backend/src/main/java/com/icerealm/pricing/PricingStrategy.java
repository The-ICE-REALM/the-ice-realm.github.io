package com.icerealm.pricing;

import com.icerealm.model.Turf;

import java.time.LocalDate;

/**
 * Decides the price of one hour on one turf.
 *
 * <p>{@link PricingService} asks each strategy in order and uses the first
 * one whose {@link #appliesTo} returns true.
 */
public interface PricingStrategy {

    /** Name of the price band shown to players, e.g. "Peak". */
    String label();

    boolean appliesTo(LocalDate date, int hour);

    /** Price in whole rupees for one hour. */
    int priceFor(Turf turf, LocalDate date, int hour);
}
