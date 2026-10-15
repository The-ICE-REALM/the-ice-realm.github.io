package com.icerealm.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.ManyToOne;

/**
 * A bookable pitch inside a venue.
 *
 * <p>This is the root of the turf inheritance hierarchy. Every format
 * (5-a-side, 7-a-side, futsal) is a subclass that supplies its own capacity,
 * base rate and description. All formats live in one table, told apart by the
 * {@code turf_type} discriminator column.
 */
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "turf_type")
public abstract class Turf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Venue venue;

    /** Pitch length x width in metres, e.g. "40 x 20 m". */
    private String dimensions;

    protected Turf() {
        // required by JPA
    }

    protected Turf(String name, String dimensions) {
        this.name = name;
        this.dimensions = dimensions;
    }

    /** Total players on the pitch across both teams. */
    public abstract int getCapacity();

    /** Weekday off-peak price for one hour, in rupees, before city and time adjustments. */
    public abstract int getBaseHourlyRate();

    /** Short format label, e.g. "5-a-side". */
    public abstract String getFormat();

    /** One-line description shown to players. Subclasses may extend it. */
    public String describe() {
        return getFormat() + " for up to " + getCapacity() + " players";
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Venue getVenue() { return venue; }
    public String getDimensions() { return dimensions; }

    void setVenue(Venue venue) {
        this.venue = venue;
    }
}
