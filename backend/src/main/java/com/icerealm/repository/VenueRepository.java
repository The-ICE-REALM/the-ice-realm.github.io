package com.icerealm.repository;

import com.icerealm.model.Venue;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VenueRepository extends JpaRepository<Venue, Long> {

    @EntityGraph(attributePaths = {"city", "turfs"})
    List<Venue> findByCitySlugOrderByIdAsc(String slug);

    @EntityGraph(attributePaths = {"city", "turfs"})
    Optional<Venue> findWithTurfsById(Long id);

    /** Every venue with its city and turfs, grouped by city. */
    @EntityGraph(attributePaths = {"city", "turfs"})
    @Query("select v from Venue v order by v.city.id, v.id")
    List<Venue> findAllForListing();

    /** Venue count per city slug, for the city strip on the home page. */
    @Query("select v.city.slug, count(v) from Venue v group by v.city.slug")
    List<Object[]> countByCity();
}
