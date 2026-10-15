package com.icerealm.service;

import com.icerealm.config.AppProperties;
import com.icerealm.dto.Dtos.OpenCountDto;
import com.icerealm.dto.Dtos.OpenSlotDto;
import com.icerealm.dto.Dtos.SlotDto;
import com.icerealm.exception.InvalidBookingException;
import com.icerealm.exception.ResourceNotFoundException;
import com.icerealm.model.Turf;
import com.icerealm.model.Venue;
import com.icerealm.pricing.PricingService;
import com.icerealm.pricing.PricingStrategy;
import com.icerealm.repository.BookedSlotRepository;
import com.icerealm.repository.TurfRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Builds the hourly slot grid and finds open slots. */
@Service
@Transactional(readOnly = true)
public class SlotService {

    private final TurfRepository turfs;
    private final BookedSlotRepository bookedSlots;
    private final CatalogService catalog;
    private final PricingService pricing;
    private final AppProperties props;
    private final Clock clock;

    public SlotService(TurfRepository turfs, BookedSlotRepository bookedSlots, CatalogService catalog,
                       PricingService pricing, AppProperties props, Clock clock) {
        this.turfs = turfs;
        this.bookedSlots = bookedSlots;
        this.catalog = catalog;
        this.pricing = pricing;
        this.props = props;
        this.clock = clock;
    }

    public List<SlotDto> slotsFor(Long turfId, LocalDate date) {
        Turf turf = turfs.findWithVenueById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("That turf doesn't exist."));
        checkWithinWindow(date);
        Set<Integer> taken = new HashSet<>(bookedSlots.findTakenHours(turfId, date));
        Venue venue = turf.getVenue();
        List<SlotDto> result = new ArrayList<>();
        for (int h = venue.getOpenHour(); h < venue.getCloseHour(); h++) {
            PricingStrategy band = pricing.strategyFor(date, h);
            boolean started = hasStarted(date, h);
            boolean available = !taken.contains(h) && !started;
            result.add(new SlotDto(h, TimeLabels.range(h, h + 1), band.priceFor(turf, date, h), band.label(),
                    available, started));
        }
        return result;
    }

    /**
     * The soonest open hours across every turf in a city, for the home page hero.
     * Picks at most one slot per venue so the list shows a spread of grounds.
     */
    public List<OpenSlotDto> nextOpenSlots(String citySlug, LocalDate date, int limit) {
        checkWithinWindow(date);
        List<Venue> venues = catalog.venueEntitiesInCity(citySlug);
        if (venues.isEmpty()) {
            throw new ResourceNotFoundException("We don't have a ground in that city yet.");
        }
        List<Long> turfIds = venues.stream().flatMap(v -> v.getTurfs().stream()).map(Turf::getId).toList();
        Set<String> taken = new HashSet<>();
        for (Object[] row : bookedSlots.findTakenHours(turfIds, date)) {
            taken.add(row[0] + ":" + row[1]);
        }

        int earliest = startOfSearch(date);
        List<OpenSlotDto> result = new ArrayList<>();
        // Walk hour by hour so results come out in time order, then by venue.
        for (int h = earliest; h < 24 && result.size() < limit; h++) {
            for (Venue v : venues) {
                if (result.size() >= limit) {
                    break;
                }
                final int hour = h;
                boolean venueAlreadyListed = result.stream().anyMatch(s -> s.venueId().equals(v.getId()));
                if (venueAlreadyListed || !v.isOpenAt(hour)) {
                    continue;
                }
                v.getTurfs().stream()
                        .filter(t -> !taken.contains(t.getId() + ":" + hour))
                        .findFirst()
                        .ifPresent(t -> result.add(new OpenSlotDto(v.getId(), v.getName(), v.getArea(), t.getId(),
                                t.getName(), t.getFormat(), date, hour, TimeLabels.range(hour, hour + 1),
                                pricing.priceFor(t, date, hour))));
            }
        }
        return result;
    }

    /**
     * How many hours are still free on every turf, for each day from {@code from}, for up to
     * {@code days} days (cut off at the end of the booking window). Hours that have started,
     * or that a booking holds, don't count.
     */
    public List<OpenCountDto> openCounts(LocalDate from, int days) {
        checkWithinWindow(from);
        LocalDate lastBookable = LocalDate.now(clock).plusDays(props.bookingWindowDays() - 1L);
        LocalDate requestedEnd = from.plusDays(Math.max(days, 1) - 1L);
        LocalDate to = requestedEnd.isAfter(lastBookable) ? lastBookable : requestedEnd;

        Set<String> taken = new HashSet<>();
        for (Object[] row : bookedSlots.findTakenSlotsBetween(from, to)) {
            taken.add(row[0] + "|" + row[1] + "|" + row[2]);
        }
        LocalDateTime now = LocalDateTime.now(clock);
        List<OpenCountDto> result = new ArrayList<>();
        for (Venue venue : catalog.allVenueEntities()) {
            for (Turf turf : venue.getTurfs()) {
                for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
                    int open = 0;
                    for (int h = venue.getOpenHour(); h < venue.getCloseHour(); h++) {
                        boolean started = !day.atStartOfDay().plusHours(h).isAfter(now);
                        if (!started && !taken.contains(turf.getId() + "|" + day + "|" + h)) {
                            open++;
                        }
                    }
                    result.add(new OpenCountDto(turf.getId(), day, open));
                }
            }
        }
        return result;
    }

    public void checkWithinWindow(LocalDate date) {
        LocalDate today = LocalDate.now(clock);
        if (date.isBefore(today)) {
            throw new InvalidBookingException("That date has passed. Choose today or a later date.");
        }
        if (date.isAfter(today.plusDays(props.bookingWindowDays() - 1L))) {
            throw new InvalidBookingException(
                    "Bookings open " + props.bookingWindowDays() + " days ahead. Choose an earlier date.");
        }
    }

    public boolean hasStarted(LocalDate date, int hour) {
        LocalDateTime now = LocalDateTime.now(clock);
        return !date.atTime(hour % 24, 0).plusDays(hour / 24).isAfter(now);
    }

    private int startOfSearch(LocalDate date) {
        if (!date.equals(LocalDate.now(clock))) {
            return 0;
        }
        return LocalDateTime.now(clock).getHour() + 1;
    }
}
