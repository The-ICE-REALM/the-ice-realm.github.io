package com.icerealm.exception;

import org.springframework.http.HttpStatus;

/** A UTR was sent for a booking that cannot take one, or a payment action is out of order. */
public class PaymentVerificationException extends IceRealmException {

    public PaymentVerificationException(String message) {
        super(message);
    }

    @Override
    public String getCode() {
        return "PAYMENT_NOT_ACCEPTED";
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.CONFLICT;
    }
}
