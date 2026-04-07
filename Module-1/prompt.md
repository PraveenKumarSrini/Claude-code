# Prompt Log

## 2026-04-02

### Prompt 3
Got this error while accessing the url:
2026-04-02T19:33:22.350+05:30 ERROR 312505 --- [fuel-prices] [nio-8080-exec-2] o.a.c.c.C.[.[.[/].[dispatcherServlet]
: Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception
[Request processing failed: java.util.UnknownFormatConversionException: Conversion = ';'] with root cause

java.util.UnknownFormatConversionException: Conversion = ';'
    at java.base/java.util.Formatter.parse(Formatter.java:2852) ~[na:na]
    at java.base/java.util.Formatter.format(Formatter.java:2774) ~[na:na]
    at java.base/java.util.Formatter.format(Formatter.java:2728) ~[na:na]
    at java.base/java.lang.String.formatted(String.java:4452) ~[na:na]
    at com.example.fuelprices.controller.DashboardController.dashboard(DashboardController.java:299) ~[classes/:na]

---

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
