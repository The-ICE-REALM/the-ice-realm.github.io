package com.icerealm.config;

import com.icerealm.model.City;
import com.icerealm.model.FiveASideTurf;
import com.icerealm.model.FutsalArena;
import com.icerealm.model.GeoPoint;
import com.icerealm.model.SevenASideTurf;
import com.icerealm.model.Turf;
import com.icerealm.model.Venue;
import com.icerealm.repository.CityRepository;
import com.icerealm.repository.VenueRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Fills an empty database with sample cities and grounds, and gives every ground the
 * details its arena card shows. Replace these with real venues before launch.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final String STANDARD = "Floodlights,Changing rooms,Drinking water,Parking";
    private static final String PREMIUM = "Floodlights,Changing rooms,Showers,Café,Parking,Bibs and balls";
    private static final String COMPACT = "Floodlights,Drinking water,Two-wheeler parking";

    /** What each ground's arena card shows, and where the ground is. Keyed by venue name. */
    private record Listing(String slug, String photoId, double rating, String highlight, String lighting,
                           double latitude, double longitude) {
    }

    private static final Map<String, Listing> LISTINGS = Map.ofEntries(
            listing("Ice Realm Lokhandwala", "lokhandwala", "1487466365202-1afdb86c764e", 4.9, "Most booked",
                    "Full floodlights", 19.1416, 72.8250),
            listing("Ice Realm Powai", "powai", "1517747614396-d21a78b850e8", 4.6, "Lakeside",
                    "Full floodlights", 19.1220, 72.8960),
            listing("Ice Realm Mill Compound", "mill-compound", "1560272564-c83b66b1ad12", 4.8, "Rooftop",
                    "LED floodlights", 19.0035, 72.8279),
            listing("Ice Realm Ghodbunder", "ghodbunder", "1543326727-cf6c39e8f84c", 4.5, "Weekend leagues",
                    "Full floodlights", 19.2640, 72.9700),
            listing("Ice Realm Upvan", "upvan", "1589487391730-58f20eb2c308", 4.4, "Lakeside",
                    "LED floodlights", 19.2228, 72.9599),
            listing("Ice Realm Baner", "baner", "1556056504-5c7696c4c28d", 4.8, "Rainproof",
                    "Full floodlights", 18.5590, 73.7868),
            listing("Ice Realm Koregaon Park", "koregaon-park", "1529900748604-07564a03e7a6", 4.7, "Futsal court",
                    "Indoor LED", 18.5374, 73.8938),
            listing("Ice Realm Hinjewadi", "hinjewadi", "1574629810360-7efbbe195018", 4.5, "After-work games",
                    "Full floodlights", 18.5912, 73.7389),
            listing("Ice Realm Dharampeth", "dharampeth", "1575361204480-aadea25e6e68", 4.6, "City centre",
                    "Full floodlights", 21.1418, 79.0619),
            listing("Ice Realm Gangapur Road", "gangapur-road", "1459865264687-595d652de67e", 4.4, "Quiet mornings",
                    "LED floodlights", 20.0090, 73.7640),
            listing("Ice Realm Saket", "saket", "1431324155629-1a6deb1dec8d", 4.7, "New arena",
                    "Night match ready", 28.5245, 77.2066),
            listing("Ice Realm Dwarka", "dwarka", "1624880357913-a8539238245b", 4.6, "Locker rooms",
                    "Full floodlights", 28.5921, 77.0460),
            listing("Ice Realm Rajouri Garden", "rajouri-garden", "1553778263-73a83bab9b0c", 4.5, "Twin 5-a-side",
                    "Full floodlights", 28.6415, 77.1209),
            listing("Ice Realm Koramangala", "koramangala", "1600679472829-3044539ce8ed", 4.8, "Weeknight leagues",
                    "LED floodlights", 12.9334, 77.6270),
            listing("Ice Realm Whitefield", "whitefield", "1570498839593-e565b39455fc", 4.6, "Monsoon-ready",
                    "Full floodlights", 12.9866, 77.7366),
            listing("Ice Realm HSR Layout", "hsr-layout", "1551958219-acbc608c6377", 4.7, "Weekend tournaments",
                    "Full floodlights", 12.9121, 77.6446),
            listing("Ice Realm Gachibowli", "gachibowli", "1579952363873-27f3bade9f55", 4.8, "Most booked",
                    "Night match ready", 17.4401, 78.3489),
            listing("Ice Realm Jubilee Hills", "jubilee-hills", "1486286701208-1d58e9338013", 4.5, "Hilltop",
                    "LED floodlights", 17.4312, 78.4072),
            listing("Ice Realm Anna Nagar", "anna-nagar", "1510051640316-cee39563ddab", 4.6, "Coaching camps",
                    "Full floodlights", 13.0850, 80.2101),
            listing("Ice Realm OMR", "omr", "1606925797300-0b35e9d1794e", 4.5, "Futsal court",
                    "Indoor LED", 12.9416, 80.2362),
            listing("Ice Realm Salt Lake", "salt-lake", "1517466787929-bc90951d0974", 4.6, "After-work games",
                    "Full floodlights", 22.5726, 88.4339),
            listing("Ice Realm New Town", "new-town", "1518604666860-9ed391f76460", 4.4, "New arena",
                    "LED floodlights", 22.5806, 88.4741));

    private final CityRepository cities;
    private final VenueRepository venues;

    public DataSeeder(CityRepository cities, VenueRepository venues) {
        this.cities = cities;
        this.venues = venues;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (cities.count() == 0) {
            seedGrounds();
        }
        describeListings();
    }

    /** Gives any ground without card details its photo, rating and location. Safe to run on every start. */
    private void describeListings() {
        for (Venue venue : venues.findAll()) {
            Listing l = LISTINGS.get(venue.getName());
            if (l != null && !venue.hasListing()) {
                venue.describeListing(l.slug(), photo(l.photoId()), l.rating(), l.highlight(), l.lighting(),
                        new GeoPoint(l.latitude(), l.longitude()));
            }
        }
    }

    private void seedGrounds() {
        City mumbai = city("mumbai", "Mumbai", "Maharashtra");
        venue(mumbai, "Ice Realm Lokhandwala", "Andheri West", "Plot 14, Lokhandwala Back Road, Andheri West", PREMIUM, 1.15,
                new SevenASideTurf("Glacier"), new FiveASideTurf("Frost"));
        venue(mumbai, "Ice Realm Powai", "Powai", "Near Powai Lake, Saki Vihar Road, Powai", STANDARD, 1.15,
                new FiveASideTurf("Rime"), new FutsalArena("Igloo"));
        venue(mumbai, "Ice Realm Mill Compound", "Lower Parel", "Rooftop, Kamala Mills Compound, Lower Parel", PREMIUM, 1.2,
                new FutsalArena("Summit"), new FiveASideTurf("Floe"));

        City thane = city("thane", "Thane", "Maharashtra");
        venue(thane, "Ice Realm Ghodbunder", "Ghodbunder Road", "Opp. Hiranandani Estate, Ghodbunder Road", STANDARD, 1.0,
                new SevenASideTurf("Glacier"), new FiveASideTurf("Frost"));
        venue(thane, "Ice Realm Upvan", "Upvan Lake", "Pokhran Road No. 2, near Upvan Lake", COMPACT, 0.95,
                new FiveASideTurf("Rime"));

        City pune = city("pune", "Pune", "Maharashtra");
        venue(pune, "Ice Realm Baner", "Baner", "Baner–Pashan Link Road, Baner", PREMIUM, 1.0,
                new SevenASideTurf("Glacier"), new FiveASideTurf("Frost"));
        venue(pune, "Ice Realm Koregaon Park", "Koregaon Park", "Lane 6, North Main Road, Koregaon Park", STANDARD, 1.05,
                new FiveASideTurf("Rime"), new FutsalArena("Igloo"));
        venue(pune, "Ice Realm Hinjewadi", "Hinjewadi", "Phase 1, near Rajiv Gandhi Infotech Park", STANDARD, 0.95,
                new SevenASideTurf("Summit"), new FiveASideTurf("Floe"));

        City nagpur = city("nagpur", "Nagpur", "Maharashtra");
        venue(nagpur, "Ice Realm Dharampeth", "Dharampeth", "West High Court Road, Dharampeth", STANDARD, 0.8,
                new SevenASideTurf("Glacier"), new FiveASideTurf("Frost"));

        City nashik = city("nashik", "Nashik", "Maharashtra");
        venue(nashik, "Ice Realm Gangapur Road", "Gangapur Road", "Near Kusumagraj Smarak, Gangapur Road", COMPACT, 0.8,
                new FiveASideTurf("Rime"), new SevenASideTurf("Summit"));

        City delhi = city("delhi", "Delhi", "Delhi NCR");
        venue(delhi, "Ice Realm Saket", "Saket", "Press Enclave Marg, Saket", PREMIUM, 1.1,
                new SevenASideTurf("Glacier"), new FutsalArena("Igloo"));
        venue(delhi, "Ice Realm Dwarka", "Dwarka", "Sector 11, near Dwarka Sports Complex", STANDARD, 1.0,
                new SevenASideTurf("Summit"), new FiveASideTurf("Frost"));
        venue(delhi, "Ice Realm Rajouri Garden", "Rajouri Garden", "Ring Road, Rajouri Garden", STANDARD, 1.05,
                new FiveASideTurf("Rime"), new FiveASideTurf("Floe"));

        City bengaluru = city("bengaluru", "Bengaluru", "Karnataka");
        venue(bengaluru, "Ice Realm Koramangala", "Koramangala", "80 Feet Road, 4th Block, Koramangala", PREMIUM, 1.1,
                new FiveASideTurf("Frost"), new FutsalArena("Igloo"));
        venue(bengaluru, "Ice Realm Whitefield", "Whitefield", "ITPL Main Road, Whitefield", STANDARD, 1.05,
                new SevenASideTurf("Glacier"), new FiveASideTurf("Rime"));
        venue(bengaluru, "Ice Realm HSR Layout", "HSR Layout", "27th Main, Sector 1, HSR Layout", STANDARD, 1.05,
                new FiveASideTurf("Floe"), new SevenASideTurf("Summit"));

        City hyderabad = city("hyderabad", "Hyderabad", "Telangana");
        venue(hyderabad, "Ice Realm Gachibowli", "Gachibowli", "Old Mumbai Highway, Gachibowli", PREMIUM, 1.0,
                new SevenASideTurf("Glacier"), new FutsalArena("Igloo"));
        venue(hyderabad, "Ice Realm Jubilee Hills", "Jubilee Hills", "Road No. 36, Jubilee Hills", STANDARD, 1.05,
                new FiveASideTurf("Frost"));

        City chennai = city("chennai", "Chennai", "Tamil Nadu");
        venue(chennai, "Ice Realm Anna Nagar", "Anna Nagar", "2nd Avenue, Anna Nagar", STANDARD, 1.0,
                new FiveASideTurf("Frost"), new SevenASideTurf("Glacier"));
        venue(chennai, "Ice Realm OMR", "OMR", "Old Mahabalipuram Road, Thoraipakkam", STANDARD, 0.95,
                new FutsalArena("Igloo"), new FiveASideTurf("Rime"));

        City kolkata = city("kolkata", "Kolkata", "West Bengal");
        venue(kolkata, "Ice Realm Salt Lake", "Salt Lake", "Sector V, Salt Lake City", STANDARD, 0.95,
                new SevenASideTurf("Glacier"), new FiveASideTurf("Frost"));
        venue(kolkata, "Ice Realm New Town", "New Town", "Action Area 1, New Town", COMPACT, 0.9,
                new FiveASideTurf("Rime"));
    }

    private static Map.Entry<String, Listing> listing(String venueName, String slug, String photoId, double rating,
                                                      String highlight, String lighting, double latitude,
                                                      double longitude) {
        return Map.entry(venueName, new Listing(slug, photoId, rating, highlight, lighting, latitude, longitude));
    }

    /** Stock photo until the ground's own is added. */
    private static String photo(String unsplashId) {
        return "https://images.unsplash.com/photo-" + unsplashId + "?crop=entropy&cs=srgb&fm=jpg&q=80&w=1080";
    }

    private City city(String slug, String name, String state) {
        return cities.save(new City(slug, name, state));
    }

    private void venue(City city, String name, String area, String address, String amenities, double priceFactor,
                       Turf... turfs) {
        String maps = "https://www.google.com/maps/search/?api=1&query="
                + (name + " " + area + " " + city.getName()).replace(' ', '+');
        Venue venue = new Venue(name, city, area, address, maps, amenities, priceFactor);
        for (Turf turf : turfs) {
            venue.addTurf(turf);
        }
        venues.save(venue);
    }
}
