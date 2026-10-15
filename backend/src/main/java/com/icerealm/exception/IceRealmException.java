package com.icerealm.exception;

import org.springframework.http.HttpStatus;

/**
 * Root of every business error the API can raise.
 *
 * <p>Each subclass fixes its own error code and HTTP status, so
 * {@link GlobalExceptionHandler} needs only one handler for the whole family.
 * The message is written for players and is shown in the UI as-is.
 */
public abstract class IceRealmException extends RuntimeException {

    protected IceRealmException(String message) {
        super(message);
    }

    /** Stable machine-readable code, e.g. "SLOT_ALREADY_BOOKED". */
    public abstract String getCode();

    public abstract HttpStatus getStatus();
}
