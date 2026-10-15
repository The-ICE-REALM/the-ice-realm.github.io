package com.icerealm.finance;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;
import java.util.Map;

/**
 * Start-up assumptions for one metro venue, loaded from finance.yml.
 * All money is in whole rupees.
 *
 * @param capex              one-time set-up costs by item
 * @param monthlyOpex        recurring monthly costs by item
 * @param turfs              number of pitches at the venue
 * @param hoursPerDay        bookable hours per pitch per day
 * @param blendedHourlyRate  average price paid per hour across formats and bands, GST included
 * @param baseOccupancy      share of hours booked in the base case, 0-1
 * @param gstRate            GST on turf rental, taken out of gross revenue
 * @param projectionYears    years in the cash-flow projection
 * @param sensitivity        occupancy levels to compare
 */
@ConfigurationProperties(prefix = "finance")
public record FinanceProperties(
        Map<String, Long> capex,
        Map<String, Long> monthlyOpex,
        int turfs,
        int hoursPerDay,
        int blendedHourlyRate,
        double baseOccupancy,
        double gstRate,
        int projectionYears,
        List<Double> sensitivity
) {
}
