package com.icerealm.controller;

import com.icerealm.config.AppProperties;
import com.icerealm.dto.Dtos.BookingDto;
import com.icerealm.exception.AdminAccessDeniedException;
import com.icerealm.model.BookingStatus;
import com.icerealm.service.BookingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Staff screen for matching UPI payments. Guarded by a shared staff code in
 * the {@code X-Admin-Token} header; a real deployment would use Spring Security.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BookingService bookings;
    private final AppProperties props;

    public AdminController(BookingService bookings, AppProperties props) {
        this.bookings = bookings;
        this.props = props;
    }

    @GetMapping("/bookings")
    public List<BookingDto> list(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                 @RequestParam(defaultValue = "PAYMENT_SUBMITTED") BookingStatus status) {
        checkToken(token);
        return bookings.listByStatus(status);
    }

    @PostMapping("/bookings/{ref}/confirm")
    public BookingDto confirm(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                              @PathVariable String ref) {
        checkToken(token);
        return bookings.confirm(ref);
    }

    @PostMapping("/bookings/{ref}/reject")
    public BookingDto reject(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                             @PathVariable String ref) {
        checkToken(token);
        return bookings.reject(ref);
    }

    private void checkToken(String token) {
        byte[] expected = props.adminToken().getBytes(StandardCharsets.UTF_8);
        byte[] given = token == null ? new byte[0] : token.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, given)) {
            throw new AdminAccessDeniedException();
        }
    }
}
