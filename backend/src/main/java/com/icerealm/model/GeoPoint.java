package com.icerealm.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * A position on the map, in decimal degrees.
 *
 * <p>A small value object: it refuses coordinates that can't exist, and it owns
 * the distance formula, so "turfs near me" never has to repeat the maths.
 */
@Embeddable
public class GeoPoint {

    private static final double EARTH_RADIUS_KM = 6371.0;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    protected GeoPoint() {
        // required by JPA
    }

    /**
     * @throws IllegalArgumentException if the latitude isn't between -90 and 90,
     *                                  or the longitude isn't between -180 and 180
     */
    public GeoPoint(double latitude, double longitude) {
        if (!(latitude >= -90 && latitude <= 90) || !(longitude >= -180 && longitude <= 180)) {
            throw new IllegalArgumentException(
                    "Latitude must be between -90 and 90, and longitude between -180 and 180.");
        }
        this.latitude = latitude;
        this.longitude = longitude;
    }

    /** Straight-line distance over the Earth's surface, in kilometres (the haversine formula). */
    public double distanceKmTo(GeoPoint other) {
        double dLat = Math.toRadians(other.latitude - latitude);
        double dLng = Math.toRadians(other.longitude - longitude);
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(latitude)) * Math.cos(Math.toRadians(other.latitude))
                * Math.pow(Math.sin(dLng / 2), 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
    }

    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
}
