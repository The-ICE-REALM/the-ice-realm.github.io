package com.icerealm.exception;

import java.time.Instant;
import java.util.Map;

/**
 * Body of every error response.
 *
 * @param fieldErrors per-field messages for validation failures; empty otherwise
 */
public record ApiError(String code, String message, Instant timestamp, Map<String, String> fieldErrors) {

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, Instant.now(), Map.of());
    }
}
