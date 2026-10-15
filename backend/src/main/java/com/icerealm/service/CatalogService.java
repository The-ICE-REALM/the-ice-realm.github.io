package com.icerealm.service;

import com.icerealm.dto.Dtos.CityDto;
import com.icerealm.dto.Dtos.NearbyVenueDto;
import com.icerealm.dto.Dtos.TurfDto;
import com.icerealm.dto.Dtos.VenueDto;
import com.icerealm.exception.InvalidLocationException;
import com.icerealm.exception.ResourceNotFoundException;
import com.icerealm.model.GeoPoint;
import com.icerealm.model.Turf;
import com.icerealm.model.Venue;
import com.icerealm.pricing.OffPeakPricing;
import com.icerealm.repository.CityRepository;
import com.icerealm.repository.VenueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Read-only lookups for cities, venues and turfs. */
@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final CityRepository cities;
    private final VenueRepository venues;
    private final OffPeakPricing offPeak;

    public CatalogService(CityRepository cities, VenueRepository venues, OffPeakPricing offPeak) {
        this.cities = cities;
        this.venues = venues;
        this.offPeak = offPeak;
    }

    public List<CityDto> listCities() {
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : venues.countByCity()) {
            counts.put((String) row[0], (Long) row[1]);
        }
        return cities.findAll().stream()
                .map(c -> new CityDto(c.getSlug(), c.getName(), c.getState(), counts.getOrDefault(c.getSlug(), 0L)))
                .toList();
    }

    public List<VenueDto> venuesInCity(String slug) {
        if (cities.findBySlug(slug).isEmpty()) {
            throw new ResourceNotFoundException("We don't have a ground in that city yet.");
        }
        return venues.findByCitySlugOrderByIdAsc(slug).stream().map(this::toDto).toList();
    }

    public List<VenueDto> allVenues() {
        return venues.findAllForListing().stream().map(this::toDto).toList();
    }

    /**
     * Venues ordered by straight-line distance from the player, nearest first.
     * Venues without a known location are left out.
     *
     * @throws InvalidLocationException if the coordinates aren't a real place on Earth
     */
    public List<NearbyVenueDto> venuesNear(double latitude, double longitude, int limit) {
        GeoPoint player;
        try {
            player = new GeoPoint(latitude, longitude);
        } catch (IllegalArgumentException e) {
            throw new InvalidLocationException();
        }
        record Ranked(Venue venue, double km) {
        }
        return venues.findAllForListing().stream()
                .filter(v -> v.getLocation() != null)
                .map(v -> new Ranked(v, v.getLocation().distanceKmTo(player)))
                .sorted(Comparator.comparingDouble(Ranked::km))
                .limit(limit)
                .map(r -> new NearbyVenueDto(toDto(r.venue()), Math.round(r.km() * 10) / 10.0))
                .toList();
    }

    public List<Venue> allVenueEntities() {
        return venues.findAllForListing();
    }

    public VenueDto venue(Long id) {
        return toDto(findVenue(id));
    }

    public Venue findVenue(Long id) {
        return venues.findWithTurfsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("That ground doesn't exist."));
    }

    public List<Venue> venueEntitiesInCity(String slug) {
        return venues.findByCitySlugOrderByIdAsc(slug);
    }

    VenueDto toDto(Venue v) {
        List<TurfDto> turfs = v.getTurfs().stream().map(this::toDto).toList();
        GeoPoint at = v.getLocation();
        return new VenueDto(v.getId(), v.getSlug(), v.getName(), v.getCity().getSlug(), v.getCity().getName(),
                v.getArea(), v.getAddress(), v.getMapsUrl(), v.getAmenityList(), v.getOpenHour(), v.getCloseHour(),
                v.getPhotoUrl(), v.getRating(), v.getHighlight(), v.getLighting(),
                at == null ? null : at.getLatitude(), at == null ? null : at.getLongitude(), turfs);
    }

    private TurfDto toDto(Turf t) {
        // "From" price is the cheapest band: a weekday off-peak hour.
        int fromPrice = offPeak.priceFor(t, LocalDate.now(), 10);
        return new TurfDto(t.getId(), t.getName(), t.getFormat(), t.getCapacity(), t.getDimensions(),
                t.describe(), fromPrice);
    }
}
