package com.icerealm.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** A physical Ice Realm ground. One venue holds one or more turfs. */
@Entity
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private City city;

    /** Neighbourhood shown next to the venue name, e.g. "Andheri West". */
    @Column(nullable = false)
    private String area;

    @Column(nullable = false)
    private String address;

    private String mapsUrl;

    /** Comma separated, e.g. "Floodlights,Parking,Changing rooms". */
    private String amenities;

    /** First bookable hour (24h clock). */
    private int openHour = 6;

    /** Hour the last slot ends (24 = midnight). */
    private int closeHour = 24;

    /** City-level price adjustment, e.g. 1.15 for Mumbai, 0.8 for Nashik. */
    private double priceFactor = 1.0;

    /** Short URL-friendly name, e.g. "lokhandwala". Set with the listing details. */
    @Column(unique = true)
    private String slug;

    /** What the arena card shows. All null until {@link #describeListing} is called. */
    private String photoUrl;

    private Double rating;

    /** One short selling point, e.g. "Rooftop". */
    private String highlight;

    /** How the pitch is lit, e.g. "Full floodlights". */
    private String lighting;

    /** Where the ground is, for "turfs near me". Null when unknown. */
    @Embedded
    private GeoPoint location;

    @OneToMany(mappedBy = "venue", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<Turf> turfs = new ArrayList<>();

    protected Venue() {
        // required by JPA
    }

    public Venue(String name, City city, String area, String address, String mapsUrl,
                 String amenities, double priceFactor) {
        this.name = name;
        this.city = city;
        this.area = area;
        this.address = address;
        this.mapsUrl = mapsUrl;
        this.amenities = amenities;
        this.priceFactor = priceFactor;
    }

    public void addTurf(Turf turf) {
        turf.setVenue(this);
        turfs.add(turf);
    }

    /**
     * Sets what the arena card shows and where the ground is on the map.
     *
     * @throws IllegalArgumentException if the rating isn't between 0 and 5
     */
    public void describeListing(String slug, String photoUrl, double rating, String highlight, String lighting,
                                GeoPoint location) {
        if (rating < 0 || rating > 5) {
            throw new IllegalArgumentException("Ratings run from 0 to 5.");
        }
        this.slug = slug;
        this.photoUrl = photoUrl;
        this.rating = rating;
        this.highlight = highlight;
        this.lighting = lighting;
        this.location = location;
    }

    public boolean hasListing() {
        return slug != null;
    }

    public boolean isOpenAt(int hour) {
        return hour >= openHour && hour < closeHour;
    }

    public List<String> getAmenityList() {
        if (amenities == null || amenities.isBlank()) {
            return List.of();
        }
        return Arrays.stream(amenities.split(",")).map(String::trim).toList();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public City getCity() { return city; }
    public String getArea() { return area; }
    public String getAddress() { return address; }
    public String getMapsUrl() { return mapsUrl; }
    public int getOpenHour() { return openHour; }
    public int getCloseHour() { return closeHour; }
    public double getPriceFactor() { return priceFactor; }
    public List<Turf> getTurfs() { return turfs; }
    public String getSlug() { return slug; }
    public String getPhotoUrl() { return photoUrl; }
    public Double getRating() { return rating; }
    public String getHighlight() { return highlight; }
    public String getLighting() { return lighting; }

    /** Hibernate loads an embeddable whose columns are all null as null, so this can be null. */
    public GeoPoint getLocation() { return location; }
}
