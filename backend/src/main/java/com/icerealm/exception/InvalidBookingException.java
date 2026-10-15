package com.icerealm.exception;

import org.springframework.http.HttpStatus;

/** The request is well-formed but breaks a booking rule (past slot, closed hours, too far ahead). */
public class InvalidBookingException extends IceRealmException {

    public InvalidBookingException(String message) {
        super(message);
    }

    @Override
    public String getCode() {
        return "INVALID_BOOKING";
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.UNPROCESSABLE_CONTENT;
    }
}
