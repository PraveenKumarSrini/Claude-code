package com.example.fuelprices.service;

import com.example.fuelprices.model.FuelPrice;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Random;

@Service
public class FuelPriceService {

    // Petrol base price range: 95.00 – 115.00 INR/litre (realistic Indian market range)
    private static final double PETROL_BASE = 95.0;
    private static final double PETROL_RANGE = 20.0;

    // Diesel base price range: 85.00 – 102.00 INR/litre
    private static final double DIESEL_BASE = 85.0;
    private static final double DIESEL_RANGE = 17.0;

    /**
     * Returns a deterministic seed derived from the city name so the same city
     * always produces the same price across JVM restarts.
     */
    private long seedFor(String city, String fuelType) {
        long hash = 0;
        String key = city.toLowerCase() + "|" + fuelType;
        for (char c : key.toCharArray()) {
            hash = 31 * hash + c;
        }
        return hash;
    }

    private double generatePrice(String city, String fuelType, double base, double range) {
        Random rng = new Random(seedFor(city, fuelType));
        double raw = base + rng.nextDouble() * range;
        // Round to 2 decimal places
        return Math.round(raw * 100.0) / 100.0;
    }

    public FuelPrice getPetrolPrice(String city) {
        double price = generatePrice(city, "petrol", PETROL_BASE, PETROL_RANGE);
        return new FuelPrice(
                capitalize(city),
                "Petrol",
                price,
                "INR",
                LocalDate.now().toString()
        );
    }

    public FuelPrice getDieselPrice(String city) {
        double price = generatePrice(city, "diesel", DIESEL_BASE, DIESEL_RANGE);
        return new FuelPrice(
                capitalize(city),
                "Diesel",
                price,
                "INR",
                LocalDate.now().toString()
        );
    }

    private String capitalize(String city) {
        if (city == null || city.isBlank()) return city;
        return Character.toUpperCase(city.charAt(0)) + city.substring(1).toLowerCase();
    }
}
