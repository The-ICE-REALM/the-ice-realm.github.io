package com.icerealm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SubmitUtrRequest(
        @NotBlank(message = "Enter the mobile number you booked with.")
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a 10-digit Indian mobile number.")
        String phone,

        @NotBlank(message = "Enter the UTR from your UPI app.")
        @Pattern(regexp = "^\\d{12}$", message = "The UTR is the 12-digit number on your GPay receipt.")
        String utr
) {
}
