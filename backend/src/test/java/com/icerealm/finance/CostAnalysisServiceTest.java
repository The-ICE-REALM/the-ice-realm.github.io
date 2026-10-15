package com.icerealm.finance;

import com.icerealm.finance.CostAnalysisService.Scenario;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CostAnalysisServiceTest {

    private final FinanceProperties props = new FinanceProperties(
            Map.of("Turf", 6_000_000L),
            Map.of("Rent", 300_000L, "Staff", 200_000L),
            2, 18, 1650, 0.6, 0.18, 3, List.of(0.4, 0.6));

    private final CostAnalysisService service = new CostAnalysisService(props);

    @Test
    void computesRevenueNetOfGst() {
        Scenario s = service.scenario(0.6);
        // 2 turfs x 18 h x 30 days x 0.6 x ₹1,650
        assertThat(s.grossMonthlyRevenue()).isEqualTo(1_069_200);
        assertThat(s.netMonthlyRevenue()).isEqualTo(906_102);
        assertThat(s.monthlyProfit()).isEqualTo(406_102);
    }

    @Test
    void breakEvenIsTheFirstMonthCumulativeProfitCoversCapex() {
        // 6,000,000 / 406,102 = 14.77 -> month 15
        assertThat(service.scenario(0.6).breakEvenMonth()).isEqualTo(15);
    }

    @Test
    void lossMakingScenarioNeverBreaksEven() {
        Scenario s = service.scenario(0.2);
        assertThat(s.monthlyProfit()).isNegative();
        assertThat(s.breakEvenMonth()).isNull();
    }

    @Test
    void projectionEndsWithCapexRecovered() {
        var summary = service.summary();
        assertThat(summary.projection()).hasSize(3);
        assertThat(summary.projection().get(0).cumulativeCash()).isEqualTo(406_102L * 12 - 6_000_000);
        assertThat(summary.sensitivity()).extracting(Scenario::occupancy).containsExactly(0.4, 0.6);
    }
}
