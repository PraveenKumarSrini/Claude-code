package com.example.fuelprices.model;

public record FuelPrice(
        String city,
        String fuelType,
        double pricePerLitre,
        String currency,
        String lastUpdated
) {}
