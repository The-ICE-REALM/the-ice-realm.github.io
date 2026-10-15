package com.icerealm.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends IceRealmException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    @Override
    public String getCode() {
        return "NOT_FOUND";
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
