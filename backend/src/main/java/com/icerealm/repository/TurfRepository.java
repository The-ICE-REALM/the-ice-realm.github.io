package com.icerealm.repository;

import com.icerealm.model.Turf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TurfRepository extends JpaRepository<Turf, Long> {

    @Query("select t from Turf t join fetch t.venue v join fetch v.city where t.id = :id")
    Optional<Turf> findWithVenueById(@Param("id") Long id);
}
