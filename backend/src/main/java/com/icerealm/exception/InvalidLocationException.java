package com.icerealm.exception;

import org.springframework.http.HttpStatus;

/** The coordinates sent for "turfs near me" aren't a real place on Earth. */
public class InvalidLocationException extends IceRealmException {

    public InvalidLocationException() {
        super("We couldn't read your location. Pick your city instead.");
    }

    @Override
    public String getCode() {
        return "INVALID_LOCATION";
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.BAD_REQUEST;
    }
}
