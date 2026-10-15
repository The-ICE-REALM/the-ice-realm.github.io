package com.icerealm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CancelBookingRequest(
        @NotBlank(message = "Enter the mobile number you booked with.")
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a 10-digit Indian mobile number.")
        String phone
) {
}
