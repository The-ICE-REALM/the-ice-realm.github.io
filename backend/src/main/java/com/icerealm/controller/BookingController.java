package com.icerealm.controller;

import com.icerealm.dto.CancelBookingRequest;
import com.icerealm.dto.CreateBookingRequest;
import com.icerealm.dto.Dtos.BookingDto;
import com.icerealm.dto.SubmitUtrRequest;
import com.icerealm.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookings;

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingDto create(@Valid @RequestBody CreateBookingRequest request) {
        return bookings.create(request);
    }

    @GetMapping("/{ref}")
    public BookingDto find(@PathVariable String ref, @RequestParam String phone) {
        return bookings.find(ref, phone);
    }

    @PostMapping("/{ref}/utr")
    public BookingDto submitUtr(@PathVariable String ref, @Valid @RequestBody SubmitUtrRequest request) {
        return bookings.submitUtr(ref, request);
    }

    /** The player gives back a hold they haven't paid for. */
    @PostMapping("/{ref}/cancel")
    public BookingDto cancel(@PathVariable String ref, @Valid @RequestBody CancelBookingRequest request) {
        return bookings.cancel(ref, request.phone());
    }
}
