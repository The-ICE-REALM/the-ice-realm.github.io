package com.icerealm.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AppPropertiesTest {

    private static final AppProperties.Upi UPI = new AppProperties.Upi("test@okaxis", "The Ice Realm");

    @Test
    void acceptsARealStaffCode() {
        assertThatCode(() -> new AppProperties(UPI, "K7QM-4XPZ-9DRT", 15, 14)).doesNotThrowAnyException();
    }

    @Test
    void refusesAMissingStaffCode() {
        assertThatThrownBy(() -> new AppProperties(UPI, "${ICE_REALM_ADMIN_TOKEN}", 15, 14))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ICE_REALM_ADMIN_TOKEN");
        assertThatThrownBy(() -> new AppProperties(UPI, " ", 15, 14)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new AppProperties(UPI, null, 15, 14)).isInstanceOf(IllegalStateException.class);
    }
}
