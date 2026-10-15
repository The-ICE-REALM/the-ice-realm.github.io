package com.icerealm.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Checks that every kind of failure reaches the client as the same ApiError JSON. */
@SpringBootTest
@AutoConfigureMockMvc
class ApiErrorTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void unknownCityIs404WithCode() throws Exception {
        mvc.perform(get("/api/cities/atlantis/venues"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("We don't have a ground in that city yet."))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void invalidBodyIs400WithFieldErrors() throws Exception {
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"turfId\":1,\"date\":\"" + LocalDate.now().plusDays(1)
                                + "\",\"startHour\":10,\"hours\":1,\"customerName\":\"\",\"phone\":\"12345\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.phone").value("Enter a 10-digit Indian mobile number."))
                .andExpect(jsonPath("$.fieldErrors.customerName").value("Enter your name."));
    }

    @Test
    void doubleBookingIs409() throws Exception {
        String body = "{\"turfId\":2,\"date\":\"" + LocalDate.now().plusDays(2)
                + "\",\"startHour\":11,\"hours\":1,\"customerName\":\"Asha\",\"phone\":\"9123456789\"}";
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SLOT_ALREADY_BOOKED"));
    }

    @Test
    void impossibleLocationIs400WithCode() throws Exception {
        mvc.perform(get("/api/venues/near").param("lat", "95").param("lng", "72.8"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_LOCATION"));
    }

    @Test
    void unreadableLocationIs400() throws Exception {
        mvc.perform(get("/api/venues/near").param("lat", "north").param("lng", "72.8"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void sitePagesAreServedByTheWebsite() throws Exception {
        mvc.perform(get("/admin")).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/no-such-page")).andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void unknownApiRouteIsStillAJson404() throws Exception {
        mvc.perform(get("/api/no-such-thing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void adminWithoutTokenIs401() throws Exception {
        mvc.perform(get("/api/admin/bookings"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("ADMIN_ACCESS_DENIED"));
    }

    @Test
    void financeSummaryLoadsFromYaml() throws Exception {
        mvc.perform(get("/api/finance/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCapex").value(7_000_000))
                .andExpect(jsonPath("$.totalMonthlyOpex").value(500_000))
                .andExpect(jsonPath("$.base.breakEvenMonth").value(18));
    }
}
