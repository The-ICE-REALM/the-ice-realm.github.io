package com.icerealm.exception;

import org.springframework.http.HttpStatus;

public class SlotAlreadyBookedException extends IceRealmException {

    public SlotAlreadyBookedException(String slotLabel) {
        super("Someone just booked " + slotLabel + ". Pick another slot.");
    }

    @Override
    public String getCode() {
        return "SLOT_ALREADY_BOOKED";
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.CONFLICT;
    }
}
