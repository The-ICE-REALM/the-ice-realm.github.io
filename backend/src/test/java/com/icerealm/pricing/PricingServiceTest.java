package com.icerealm.pricing;

import com.icerealm.model.City;
import com.icerealm.model.FiveASideTurf;
import com.icerealm.model.FutsalArena;
import com.icerealm.model.SevenASideTurf;
import com.icerealm.model.Turf;
import com.icerealm.model.Venue;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PricingServiceTest {

    private static final LocalDate WEDNESDAY = LocalDate.of(2026, 10, 7);
    private static final LocalDate SATURDAY = LocalDate.of(2026, 10, 10);

    private final PricingService pricing =
            new PricingService(List.of(new WeekendPricing(), new PeakPricing(), new OffPeakPricing()));

    private static Turf onVenue(Turf turf, double priceFactor) {
        Venue venue = new Venue("Test", new City("t", "Test", "Test"), "Area", "Address", null, null, priceFactor);
        venue.addTurf(turf);
        return turf;
    }

    @Test
    void subclassesSupplyTheirOwnBaseRateAndCapacity() {
        assertThat(new FiveASideTurf("A").getBaseHourlyRate()).isEqualTo(1200);
        assertThat(new SevenASideTurf("B").getCapacity()).isEqualTo(14);
        assertThat(new FutsalArena("C").describe()).isEqualTo("Futsal for up to 10 players, indoors and air-cooled");
    }

    @Test
    void weekdayMorningIsOffPeak() {
        Turf turf = onVenue(new FiveASideTurf("A"), 1.0);
        assertThat(pricing.strategyFor(WEDNESDAY, 10)).isInstanceOf(OffPeakPricing.class);
        assertThat(pricing.priceFor(turf, WEDNESDAY, 10)).isEqualTo(1200);
    }

    @Test
    void weekdayEveningIsPeak() {
        Turf turf = onVenue(new FiveASideTurf("A"), 1.0);
        assertThat(pricing.strategyFor(WEDNESDAY, 19).label()).isEqualTo("Peak");
        assertThat(pricing.priceFor(turf, WEDNESDAY, 19)).isEqualTo(1450); // 1440 rounded to nearest 50
    }

    @Test
    void weekendBeatsPeakEvenInTheEvening() {
        Turf turf = onVenue(new SevenASideTurf("B"), 1.0);
        assertThat(pricing.strategyFor(SATURDAY, 19)).isInstanceOf(WeekendPricing.class);
        assertThat(pricing.priceFor(turf, SATURDAY, 19)).isEqualTo(2250);
    }

    @Test
    void cityFactorScalesThePrice() {
        Turf mumbai = onVenue(new SevenASideTurf("B"), 1.15);
        assertThat(pricing.priceFor(mumbai, WEDNESDAY, 10)).isEqualTo(2050); // 2070 rounded to nearest 50
    }

    @Test
    void multiHourBookingPricesEachHourOnItsOwnBand() {
        Turf turf = onVenue(new FiveASideTurf("A"), 1.0);
        // 5-6 pm off-peak (1200) + 6-7 pm peak (1450)
        assertThat(pricing.priceFor(turf, WEDNESDAY, 17, 2)).isEqualTo(2650);
    }
}
