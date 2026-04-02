package com.example.fuelprices.controller;

import com.example.fuelprices.model.FuelPrice;
import com.example.fuelprices.service.FuelPriceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
public class FuelController {

    private static final Set<String> SUPPORTED_CITIES = Set.of(
            "mumbai", "delhi", "bangalore", "chennai", "kolkata"
    );

    private final FuelPriceService fuelPriceService;

    public FuelController(FuelPriceService fuelPriceService) {
        this.fuelPriceService = fuelPriceService;
    }

    @GetMapping("/petrol/{city}")
    public ResponseEntity<?> getPetrolPrice(@PathVariable String city) {
        if (!SUPPORTED_CITIES.contains(city.toLowerCase())) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("City not supported. Supported cities: " + SUPPORTED_CITIES)
            );
        }
        FuelPrice price = fuelPriceService.getPetrolPrice(city);
        return ResponseEntity.ok(price);
    }

    @GetMapping("/diesel/{city}")
    public ResponseEntity<?> getDieselPrice(@PathVariable String city) {
        if (!SUPPORTED_CITIES.contains(city.toLowerCase())) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("City not supported. Supported cities: " + SUPPORTED_CITIES)
            );
        }
        FuelPrice price = fuelPriceService.getDieselPrice(city);
        return ResponseEntity.ok(price);
    }

    private record ErrorResponse(String error) {}
}
