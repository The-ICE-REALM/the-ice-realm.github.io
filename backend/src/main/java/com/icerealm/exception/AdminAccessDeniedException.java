package com.icerealm.exception;

import org.springframework.http.HttpStatus;

public class AdminAccessDeniedException extends IceRealmException {

    public AdminAccessDeniedException() {
        super("That staff code is not valid.");
    }

    @Override
    public String getCode() {
        return "ADMIN_ACCESS_DENIED";
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.UNAUTHORIZED;
    }
}
