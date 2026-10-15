package com.icerealm.repository;

import com.icerealm.model.BookedSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface BookedSlotRepository extends JpaRepository<BookedSlot, Long> {

    @Query("select s.slotHour from BookedSlot s where s.turf.id = :turfId and s.playDate = :date")
    List<Integer> findTakenHours(@Param("turfId") Long turfId, @Param("date") LocalDate date);

    /** Rows of [turfId, date, hour] for every taken slot on every turf between two dates, inclusive. */
    @Query("select s.turf.id, s.playDate, s.slotHour from BookedSlot s where s.playDate between :from and :to")
    List<Object[]> findTakenSlotsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /** Rows of [turfId, hour] for every taken slot across the given turfs on one day. */
    @Query("select s.turf.id, s.slotHour from BookedSlot s where s.turf.id in :turfIds and s.playDate = :date")
    List<Object[]> findTakenHours(@Param("turfIds") Collection<Long> turfIds, @Param("date") LocalDate date);
}
