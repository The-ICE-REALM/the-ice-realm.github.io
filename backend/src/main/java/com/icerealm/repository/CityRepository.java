package com.icerealm.repository;

import com.icerealm.model.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CityRepository extends JpaRepository<City, Long> {

    Optional<City> findBySlug(String slug);
}
