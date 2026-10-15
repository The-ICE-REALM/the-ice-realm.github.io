package com.icerealm.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/** Small outdoor cage for quick 5 vs 5 games. */
@Entity
@DiscriminatorValue("FIVE")
public class FiveASideTurf extends Turf {

    protected FiveASideTurf() {
        // required by JPA
    }

    public FiveASideTurf(String name) {
        super(name, "40 x 20 m");
    }

    @Override
    public int getCapacity() {
        return 10;
    }

    @Override
    public int getBaseHourlyRate() {
        return 1200;
    }

    @Override
    public String getFormat() {
        return "5-a-side";
    }
}
