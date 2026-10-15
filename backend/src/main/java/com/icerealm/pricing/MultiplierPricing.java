package com.icerealm.pricing;

import com.icerealm.model.Turf;

import java.time.LocalDate;

/**
 * Shared behaviour for strategies that scale the turf's base rate.
 *
 * <p>Subclasses only say when they apply and by how much; the price formula
 * (base rate x city factor x band multiplier, rounded to the nearest ₹50) is
 * written once here.
 */
public abstract class MultiplierPricing implements PricingStrategy {

    private static final int ROUND_TO = 50;

    private final double multiplier;

    protected MultiplierPricing(double multiplier) {
        this.multiplier = multiplier;
    }

    @Override
    public int priceFor(Turf turf, LocalDate date, int hour) {
        double raw = turf.getBaseHourlyRate() * turf.getVenue().getPriceFactor() * multiplier;
        return (int) (Math.round(raw / ROUND_TO) * ROUND_TO);
    }

    public double getMultiplier() {
        return multiplier;
    }
}
