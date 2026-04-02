package com.example.fuelprices.controller;

import com.example.fuelprices.model.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.util.concurrent.TimeUnit;

@RestController
public class HealthController {

    private static final long START_TIME_MS = ManagementFactory.getRuntimeMXBean().getStartTime();

    @GetMapping("/health")
    public HealthResponse health() {
        long uptimeSeconds = TimeUnit.MILLISECONDS.toSeconds(
                System.currentTimeMillis() - START_TIME_MS
        );
        return new HealthResponse("ok", uptimeSeconds);
    }
}
