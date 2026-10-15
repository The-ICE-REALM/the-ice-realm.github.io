package com.icerealm.service;

import com.icerealm.dto.Dtos.NearbyVenueDto;
import com.icerealm.dto.Dtos.VenueDto;
import com.icerealm.exception.InvalidLocationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class CatalogServiceTest {

    @Autowired
    private CatalogService catalog;

    @Test
    void everySeededGroundHasItsCardDetails() {
        List<VenueDto> venues = catalog.allVenues();

        assertThat(venues).hasSize(22);
        assertThat(venues).allSatisfy(v -> {
            assertThat(v.slug()).isNotBlank();
            assertThat(v.photoUrl()).startsWith("https://");
            assertThat(v.rating()).isBetween(0.0, 5.0);
            assertThat(v.latitude()).isNotNull();
            assertThat(v.turfs()).isNotEmpty();
        });
    }

    @Test
    void nearestGroundComesFirst() {
        // A player in Andheri West, a short walk from Lokhandwala.
        List<NearbyVenueDto> near = catalog.venuesNear(19.1364, 72.8296, 5);

        assertThat(near).hasSize(5);
        assertThat(near.getFirst().venue().slug()).isEqualTo("lokhandwala");
        assertThat(near.getFirst().distanceKm()).isLessThan(2.0);
        assertThat(near).extracting(NearbyVenueDto::distanceKm).isSorted();
        assertThat(near).allSatisfy(n -> assertThat(n.venue().citySlug()).isIn("mumbai", "thane"));
    }

    @Test
    void rejectsALocationThatIsNotOnEarth() {
        assertThatThrownBy(() -> catalog.venuesNear(95, 72.8, 5)).isInstanceOf(InvalidLocationException.class);
    }
}
