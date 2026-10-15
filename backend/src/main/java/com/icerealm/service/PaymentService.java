package com.icerealm.service;

import com.icerealm.config.AppProperties;
import com.icerealm.dto.Dtos.UpiDto;
import com.icerealm.model.Booking;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Builds UPI payment links.
 *
 * <p>The link follows the NPCI UPI deep-link format. Opening it on a phone
 * launches GPay (or any UPI app) with the payee, amount and booking reference
 * already filled in; the same string encoded as a QR code works from a laptop.
 */
@Service
public class PaymentService {

    private final AppProperties props;

    public PaymentService(AppProperties props) {
        this.props = props;
    }

    public UpiDto upiFor(Booking booking) {
        AppProperties.Upi upi = props.upi();
        String uri = "upi://pay"
                + "?pa=" + encode(upi.vpa())
                + "&pn=" + encode(upi.payeeName())
                + "&am=" + booking.getAmount() + ".00"
                + "&cu=INR"
                + "&tn=" + encode("Ice Realm " + booking.getRef());
        return new UpiDto(upi.vpa(), upi.payeeName(), uri);
    }

    private static String encode(String value) {
        // UPI apps expect %20 for spaces, not the "+" form encoding produces.
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
