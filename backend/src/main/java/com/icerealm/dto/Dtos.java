package com.icerealm.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Response shapes sent to the React app. Kept together because each is a few lines. */
public final class Dtos {

    private Dtos() {
    }

    public record CityDto(String slug, String name, String state, long venueCount) {
    }

    public record TurfDto(Long id, String name, String format, int capacity, String dimensions,
                          String description, int fromPrice) {
    }

    /** Listing details (photo to longitude) are null for a venue that hasn't been described yet. */
    public record VenueDto(Long id, String slug, String name, String citySlug, String cityName, String area,
                           String address, String mapsUrl, List<String> amenities, int openHour, int closeHour,
                           String photoUrl, Double rating, String highlight, String lighting,
                           Double latitude, Double longitude, List<TurfDto> turfs) {
    }

    /** A venue and its straight-line distance from the player, for "turfs near me". */
    public record NearbyVenueDto(VenueDto venue, double distanceKm) {
    }

    /** How many hours are still free on one turf on one day. */
    public record OpenCountDto(Long turfId, LocalDate date, int openSlots) {
    }

    /**
     * One hour on one turf. {@code label} is ready to display, e.g. "7–8 pm".
     * {@code started} tells a slot that has passed apart from one that's booked.
     */
    public record SlotDto(int hour, String label, int price, String band, boolean available, boolean started) {
    }

    /** A bookable slot surfaced in the home page hero. */
    public record OpenSlotDto(Long venueId, String venueName, String area, Long turfId, String turfName,
                              String format, LocalDate date, int hour, String label, int price) {
    }

    public record BookingDto(String ref, String status, String venueName, String area, String cityName,
                             String turfName, String format, LocalDate date, int startHour, int endHour,
                             String timeLabel, int amount, String customerName, String phoneMasked,
                             Instant createdAt, Instant holdExpiresAt, String utr, UpiDto upi) {
    }

    /** Everything the checkout page needs to show a QR code and a GPay button. */
    public record UpiDto(String payeeVpa, String payeeName, String uri) {
    }
}
