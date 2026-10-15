package com.icerealm.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings under {@code app.*} in application.yml.
 *
 * @param upi        where players send money
 * @param adminToken staff code required by the admin endpoints
 * @param holdMinutes how long an unpaid booking keeps its slot
 * @param bookingWindowDays how many days ahead players can book
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Upi upi, String adminToken, int holdMinutes, int bookingWindowDays) {

    /**
     * Refuses to start without a real staff code. Spring leaves a placeholder it can't fill
     * as literal text, so an unset {@code ${ICE_REALM_ADMIN_TOKEN}} would otherwise become
     * a staff code anyone could guess.
     */
    public AppProperties {
        if (adminToken == null || adminToken.isBlank() || adminToken.contains("${")) {
            throw new IllegalStateException("No staff code is set. Set the ICE_REALM_ADMIN_TOKEN environment "
                    + "variable, or app.admin-token in backend/secrets.yml.");
        }
    }

    public record Upi(String vpa, String payeeName) {
    }
}
