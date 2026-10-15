package com.icerealm.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/** Covered, air-cooled court with a hard surface. Plays the same in monsoon. */
@Entity
@DiscriminatorValue("FUTSAL")
public class FutsalArena extends Turf {

    protected FutsalArena() {
        // required by JPA
    }

    public FutsalArena(String name) {
        super(name, "38 x 20 m");
    }

    @Override
    public int getCapacity() {
        return 10;
    }

    @Override
    public int getBaseHourlyRate() {
        return 1500;
    }

    @Override
    public String getFormat() {
        return "Futsal";
    }

    @Override
    public String describe() {
        return super.describe() + ", indoors and air-cooled";
    }
}
