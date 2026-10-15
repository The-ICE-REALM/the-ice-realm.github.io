package com.icerealm.finance;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Break-even and return-on-investment model for opening one venue.
 *
 * <pre>
 * gross revenue / month = turfs x hours per day x 30 x occupancy x blended rate
 * net revenue / month   = gross / (1 + GST)
 * operating profit      = net revenue - monthly opex
 * break-even month      = ceil(capex / operating profit)
 * ROI over N years      = (operating profit x 12N - capex) / capex
 * </pre>
 *
 * Taxes on profit and depreciation are left out to keep the model readable.
 */
@Service
public class CostAnalysisService {

    static final int DAYS_PER_MONTH = 30;

    private final FinanceProperties props;

    public CostAnalysisService(FinanceProperties props) {
        this.props = props;
    }

    public record Scenario(double occupancy, long grossMonthlyRevenue, long netMonthlyRevenue,
                           long monthlyProfit, Integer breakEvenMonth, double roiPercent) {
    }

    public record YearRow(int year, long netRevenue, long opex, long profit, long cumulativeCash) {
    }

    public record Summary(Map<String, Long> capex, long totalCapex, Map<String, Long> monthlyOpex,
                          long totalMonthlyOpex, int turfs, int hoursPerDay, int blendedHourlyRate,
                          double gstRate, int projectionYears, Scenario base, List<YearRow> projection,
                          List<Scenario> sensitivity) {
    }

    public Summary summary() {
        long capex = totalCapex();
        long opex = totalMonthlyOpex();
        Scenario base = scenario(props.baseOccupancy());
        List<Scenario> sensitivity = props.sensitivity().stream().map(this::scenario).toList();
        return new Summary(props.capex(), capex, props.monthlyOpex(), opex, props.turfs(), props.hoursPerDay(),
                props.blendedHourlyRate(), props.gstRate(), props.projectionYears(), base,
                projection(base), sensitivity);
    }

    public Scenario scenario(double occupancy) {
        long gross = Math.round(props.turfs() * props.hoursPerDay() * DAYS_PER_MONTH * occupancy
                * props.blendedHourlyRate());
        long net = Math.round(gross / (1 + props.gstRate()));
        long profit = net - totalMonthlyOpex();
        return new Scenario(occupancy, gross, net, profit, breakEvenMonth(profit), roiPercent(profit));
    }

    /** Month in which cumulative profit first covers the set-up cost, or null if it never does. */
    Integer breakEvenMonth(long monthlyProfit) {
        if (monthlyProfit <= 0) {
            return null;
        }
        return (int) Math.ceil((double) totalCapex() / monthlyProfit);
    }

    double roiPercent(long monthlyProfit) {
        long totalProfit = monthlyProfit * 12L * props.projectionYears();
        double roi = (double) (totalProfit - totalCapex()) / totalCapex() * 100;
        return Math.round(roi * 10) / 10.0;
    }

    private List<YearRow> projection(Scenario base) {
        List<YearRow> rows = new ArrayList<>();
        long cumulative = -totalCapex();
        for (int year = 1; year <= props.projectionYears(); year++) {
            long revenue = base.netMonthlyRevenue() * 12;
            long opex = totalMonthlyOpex() * 12;
            long profit = revenue - opex;
            cumulative += profit;
            rows.add(new YearRow(year, revenue, opex, profit, cumulative));
        }
        return rows;
    }

    long totalCapex() {
        return props.capex().values().stream().mapToLong(Long::longValue).sum();
    }

    long totalMonthlyOpex() {
        return props.monthlyOpex().values().stream().mapToLong(Long::longValue).sum();
    }
}
