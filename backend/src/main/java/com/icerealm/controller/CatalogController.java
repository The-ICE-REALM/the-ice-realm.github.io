package com.icerealm.controller;

import com.icerealm.dto.Dtos.CityDto;
import com.icerealm.dto.Dtos.NearbyVenueDto;
import com.icerealm.dto.Dtos.OpenCountDto;
import com.icerealm.dto.Dtos.OpenSlotDto;
import com.icerealm.dto.Dtos.SlotDto;
import com.icerealm.dto.Dtos.VenueDto;
import com.icerealm.service.CatalogService;
import com.icerealm.service.SlotService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CatalogService catalog;
    private final SlotService slots;

    public CatalogController(CatalogService catalog, SlotService slots) {
        this.catalog = catalog;
        this.slots = slots;
    }

    @GetMapping("/cities")
    public List<CityDto> cities() {
        return catalog.listCities();
    }

    @GetMapping("/cities/{slug}/venues")
    public List<VenueDto> venues(@PathVariable String slug) {
        return catalog.venuesInCity(slug);
    }

    @GetMapping("/cities/{slug}/open-slots")
    public List<OpenSlotDto> openSlots(@PathVariable String slug,
                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                       @RequestParam(defaultValue = "6") int limit) {
        return slots.nextOpenSlots(slug, date, Math.min(limit, 12));
    }

    @GetMapping("/venues")
    public List<VenueDto> allVenues() {
        return catalog.allVenues();
    }

    /** Grounds nearest to the player first. The literal path wins over {@code /venues/{id}}. */
    @GetMapping("/venues/near")
    public List<NearbyVenueDto> venuesNear(@RequestParam double lat, @RequestParam double lng,
                                           @RequestParam(defaultValue = "50") int limit) {
        return catalog.venuesNear(lat, lng, Math.clamp(limit, 1, 50));
    }

    @GetMapping("/venues/{id}")
    public VenueDto venue(@PathVariable Long id) {
        return catalog.venue(id);
    }

    /** Free hours per turf per day, for the arena cards and the date picker. */
    @GetMapping("/availability")
    public List<OpenCountDto> availability(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                           LocalDate from,
                                           @RequestParam(defaultValue = "7") int days) {
        return slots.openCounts(from, days);
    }

    @GetMapping("/turfs/{id}/slots")
    public List<SlotDto> turfSlots(@PathVariable Long id,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return slots.slotsFor(id, date);
    }
}
