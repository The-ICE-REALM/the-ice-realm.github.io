package com.icerealm.repository;

import com.icerealm.model.Booking;
import com.icerealm.model.BookingStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"turf", "turf.venue", "turf.venue.city"})
    Optional<Booking> findByRef(String ref);

    boolean existsByRef(String ref);

    @EntityGraph(attributePaths = {"turf", "turf.venue", "turf.venue.city"})
    List<Booking> findByStatusOrderByCreatedAtAsc(BookingStatus status);

    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, Instant cutoff);
}
