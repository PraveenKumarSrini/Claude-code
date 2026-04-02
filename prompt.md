# Prompt Log

## 2026-04-02

### Prompt 2
Add a beautiful HTML dashboard page at GET / that shows the petrol and diesel prices for 5 cities
in a responsive grid. Use inline CSS (no external dependencies). Each card should show the city name,
petrol price, diesel price, emoji based on the prices. Make it look professional.

---

### Prompt 1
Create a Spring boot app. Add three endpoints:
- GET /health — returns { status: "ok", uptime: process.uptime() }
- GET /petrol/:city — returns mock pricing data for the given city.
  Use realistic-looking random data seeded by the city name so the same city always returns the same price.
- GET /diesel/:city — returns mock pricing data for the given city.
  Use realistic-looking random data seeded by the city name so the same city always returns the same price.
