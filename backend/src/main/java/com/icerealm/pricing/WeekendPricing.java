package com.icerealm.pricing;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;

/** Saturdays and Sundays, all day. Checked first so it wins over peak. */
@Component
@Order(1)
public class WeekendPricing extends MultiplierPricing {

    public WeekendPricing() {
        super(1.25);
    }

    @Override
    public String label() {
        return "Weekend";
    }

    @Override
    public boolean appliesTo(LocalDate date, int hour) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }
}
