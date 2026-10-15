package com.icerealm.controller;

import com.icerealm.finance.CostAnalysisService;
import com.icerealm.finance.CostAnalysisService.Summary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final CostAnalysisService costAnalysis;

    public FinanceController(CostAnalysisService costAnalysis) {
        this.costAnalysis = costAnalysis;
    }

    @GetMapping("/summary")
    public Summary summary() {
        return costAnalysis.summary();
    }
}
