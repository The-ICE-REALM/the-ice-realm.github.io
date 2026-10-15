package com.icerealm.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/** Larger outdoor pitch for full squads and league nights. */
@Entity
@DiscriminatorValue("SEVEN")
public class SevenASideTurf extends Turf {

    protected SevenASideTurf() {
        // required by JPA
    }

    public SevenASideTurf(String name) {
        super(name, "60 x 35 m");
    }

    @Override
    public int getCapacity() {
        return 14;
    }

    @Override
    public int getBaseHourlyRate() {
        return 1800;
    }

    @Override
    public String getFormat() {
        return "7-a-side";
    }

    @Override
    public String describe() {
        return super.describe() + ", with room for rolling subs";
    }
}
