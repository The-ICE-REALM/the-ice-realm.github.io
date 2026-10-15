package com.icerealm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateBookingRequest(
        @NotNull(message = "Choose a turf.")
        Long turfId,

        @NotNull(message = "Choose a date.")
        @FutureOrPresent(message = "Choose today or a later date.")
        LocalDate date,

        @NotNull(message = "Choose a start time.")
        @Min(value = 0, message = "Choose a start time.")
        @Max(value = 23, message = "Choose a start time.")
        Integer startHour,

        @NotNull(message = "Choose how long you want to play.")
        @Min(value = 1, message = "Book at least 1 hour.")
        @Max(value = 3, message = "You can book up to 3 hours at a time.")
        Integer hours,

        @NotBlank(message = "Enter your name.")
        @Size(max = 60, message = "Keep your name under 60 characters.")
        String customerName,

        @NotBlank(message = "Enter your mobile number.")
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a 10-digit Indian mobile number.")
        String phone,

        @Email(message = "Enter a valid email, or leave it blank.")
        String email
) {
}
