package com.icerealm.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

class GeoPointTest {

    private static final GeoPoint MUMBAI = new GeoPoint(18.9398, 72.8355);
    private static final GeoPoint PUNE = new GeoPoint(18.5286, 73.8743);

    @Test
    void measuresTheStraightLineDistanceBetweenCities() {
        assertThat(MUMBAI.distanceKmTo(PUNE)).isCloseTo(119.0, within(3.0));
    }

    @Test
    void distanceIsTheSameBothWaysAndZeroToItself() {
        assertThat(PUNE.distanceKmTo(MUMBAI)).isCloseTo(MUMBAI.distanceKmTo(PUNE), within(1e-9));
        assertThat(MUMBAI.distanceKmTo(MUMBAI)).isCloseTo(0.0, within(1e-9));
    }

    @Test
    void refusesCoordinatesThatAreNotOnEarth() {
        assertThatThrownBy(() -> new GeoPoint(91, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new GeoPoint(0, -181)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new GeoPoint(Double.NaN, 0)).isInstanceOf(IllegalArgumentException.class);
    }
}
