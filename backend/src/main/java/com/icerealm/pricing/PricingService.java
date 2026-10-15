package com.icerealm.pricing;

import com.icerealm.model.Turf;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class PricingService {

    /** Injected in {@code @Order} sequence: weekend, peak, off-peak. */
    private final List<PricingStrategy> strategies;

    public PricingService(List<PricingStrategy> strategies) {
        this.strategies = strategies;
    }

    public PricingStrategy strategyFor(LocalDate date, int hour) {
        return strategies.stream()
                .filter(s -> s.appliesTo(date, hour))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No pricing strategy for " + date + " " + hour));
    }

    public int priceFor(Turf turf, LocalDate date, int hour) {
        return strategyFor(date, hour).priceFor(turf, date, hour);
    }

    /** Total for a run of consecutive hours, each priced on its own band. */
    public int priceFor(Turf turf, LocalDate date, int startHour, int hours) {
        int total = 0;
        for (int h = startHour; h < startHour + hours; h++) {
            total += priceFor(turf, date, h);
        }
        return total;
    }
}
