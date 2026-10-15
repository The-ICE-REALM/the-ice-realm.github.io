package com.icerealm.pricing;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/** Weekday evenings from 6 pm to 11 pm, when after-work games fill up. */
@Component
@Order(2)
public class PeakPricing extends MultiplierPricing {

    static final int PEAK_START = 18;
    static final int PEAK_END = 23;

    public PeakPricing() {
        super(1.2);
    }

    @Override
    public String label() {
        return "Peak";
    }

    @Override
    public boolean appliesTo(LocalDate date, int hour) {
        return hour >= PEAK_START && hour < PEAK_END;
    }
}
