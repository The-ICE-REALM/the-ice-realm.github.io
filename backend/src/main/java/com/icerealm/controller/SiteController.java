package com.icerealm.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the website's own pages. The built site lives in {@code static/}; Spring Boot serves
 * its home page at "/" on its own, and this sends the site's other pages (the staff page, and
 * any unknown page, which shows "That page isn't here") to the same app. File requests and
 * {@code /api} are left alone, so a missing API route still gets the usual JSON 404.
 */
@Controller
public class SiteController {

    @GetMapping({"/{page:^(?!api$)[^.]+$}", "/admin/"})
    public String page() {
        return "forward:/index.html";
    }
}
