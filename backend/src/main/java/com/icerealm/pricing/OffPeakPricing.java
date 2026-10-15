package com.icerealm.pricing;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/** Every other hour. Always applies, so it must be checked last. */
@Component
@Order(3)
public class OffPeakPricing extends MultiplierPricing {

    public OffPeakPricing() {
        super(1.0);
    }

    @Override
    public String label() {
        return "Off-peak";
    }

    @Override
    public boolean appliesTo(LocalDate date, int hour) {
        return true;
    }
}
