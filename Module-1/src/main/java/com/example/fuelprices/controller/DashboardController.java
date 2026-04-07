package com.example.fuelprices.controller;

import com.example.fuelprices.model.FuelPrice;
import com.example.fuelprices.service.FuelPriceService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
public class DashboardController {

    private static final List<String> CITIES = List.of(
            "mumbai", "delhi", "bangalore", "chennai", "kolkata"
    );

    private static final String[] CITY_ICONS = {"🌊", "🏛️", "🌿", "🌞", "🎨"};

    // HTML_TEMPLATE uses {{TODAY}} and {{CARDS}} placeholders so that String.replace()
    // can substitute dynamic values without triggering String.format's '%' parser.
    private static final String HTML_TEMPLATE =
            "<!DOCTYPE html>\n"
            + "<html lang=\"en\">\n"
            + "<head>\n"
            + "  <meta charset=\"UTF-8\"/>\n"
            + "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>\n"
            + "  <title>Fuel Price Dashboard</title>\n"
            + "  <style>\n"
            + "    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n"
            + "    body {\n"
            + "      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n"
            + "      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);\n"
            + "      min-height: 100vh;\n"
            + "      padding: 2rem 1rem 4rem;\n"
            + "      color: #e2e8f0;\n"
            + "    }\n"
            + "    header { text-align: center; margin-bottom: 3rem; }\n"
            + "    header .badge {\n"
            + "      display: inline-block;\n"
            + "      background: rgba(255,255,255,0.08);\n"
            + "      border: 1px solid rgba(255,255,255,0.15);\n"
            + "      border-radius: 999px;\n"
            + "      padding: 0.3rem 1rem;\n"
            + "      font-size: 0.75rem;\n"
            + "      letter-spacing: 0.12em;\n"
            + "      text-transform: uppercase;\n"
            + "      color: #a5b4fc;\n"
            + "      margin-bottom: 1rem;\n"
            + "    }\n"
            + "    header h1 {\n"
            + "      font-size: clamp(1.8rem, 5vw, 3rem);\n"
            + "      font-weight: 800;\n"
            + "      background: linear-gradient(90deg, #a78bfa, #60a5fa, #34d399);\n"
            + "      -webkit-background-clip: text;\n"
            + "      -webkit-text-fill-color: transparent;\n"
            + "      background-clip: text;\n"
            + "      line-height: 1.2;\n"
            + "      margin-bottom: 0.5rem;\n"
            + "    }\n"
            + "    header p { color: #94a3b8; font-size: 0.95rem; }\n"
            + "    .grid {\n"
            + "      display: grid;\n"
            + "      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));\n"
            + "      gap: 1.5rem;\n"
            + "      max-width: 1200px;\n"
            + "      margin: 0 auto;\n"
            + "    }\n"
            + "    .card {\n"
            + "      background: rgba(255,255,255,0.05);\n"
            + "      border: 1px solid rgba(255,255,255,0.1);\n"
            + "      border-radius: 20px;\n"
            + "      padding: 1.5rem;\n"
            + "      backdrop-filter: blur(12px);\n"
            + "      transition: transform 0.2s ease, box-shadow 0.2s ease;\n"
            + "      position: relative;\n"
            + "      overflow: hidden;\n"
            + "    }\n"
            + "    .card::before {\n"
            + "      content: '';\n"
            + "      position: absolute;\n"
            + "      inset: 0;\n"
            + "      border-radius: 20px;\n"
            + "      background: linear-gradient(135deg, rgba(167,139,250,0.08), rgba(96,165,250,0.04));\n"
            + "      pointer-events: none;\n"
            + "    }\n"
            + "    .card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }\n"
            + "    .card-header {\n"
            + "      display: flex;\n"
            + "      align-items: center;\n"
            + "      gap: 0.75rem;\n"
            + "      margin-bottom: 1.4rem;\n"
            + "      padding-bottom: 1rem;\n"
            + "      border-bottom: 1px solid rgba(255,255,255,0.08);\n"
            + "    }\n"
            + "    .city-icon { font-size: 2rem; line-height: 1; }\n"
            + "    .city-name { font-size: 1.25rem; font-weight: 700; color: #f1f5f9; letter-spacing: 0.01em; }\n"
            + "    .fuel-row {\n"
            + "      display: flex;\n"
            + "      align-items: center;\n"
            + "      justify-content: space-between;\n"
            + "      padding: 0.6rem 0;\n"
            + "    }\n"
            + "    .fuel-row + .fuel-row { border-top: 1px solid rgba(255,255,255,0.05); }\n"
            + "    .fuel-label {\n"
            + "      display: flex;\n"
            + "      align-items: center;\n"
            + "      gap: 0.5rem;\n"
            + "      font-size: 0.9rem;\n"
            + "      color: #94a3b8;\n"
            + "      font-weight: 500;\n"
            + "    }\n"
            + "    .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }\n"
            + "    .petrol-dot { background: #f472b6; box-shadow: 0 0 6px #f472b6; }\n"
            + "    .diesel-dot { background: #34d399; box-shadow: 0 0 6px #34d399; }\n"
            + "    .fuel-price-block { display: flex; align-items: center; gap: 0.5rem; }\n"
            + "    .price-badge {\n"
            + "      display: inline-block;\n"
            + "      border-radius: 8px;\n"
            + "      padding: 0.3rem 0.75rem;\n"
            + "      font-size: 0.95rem;\n"
            + "      font-weight: 700;\n"
            + "      color: #fff;\n"
            + "      letter-spacing: 0.02em;\n"
            + "      min-width: 90px;\n"
            + "      text-align: right;\n"
            + "    }\n"
            + "    .price-emoji { font-size: 1.2rem; }\n"
            + "    .card-footer {\n"
            + "      margin-top: 1.2rem;\n"
            + "      padding-top: 0.8rem;\n"
            + "      border-top: 1px solid rgba(255,255,255,0.06);\n"
            + "      font-size: 0.75rem;\n"
            + "      color: #475569;\n"
            + "      text-align: right;\n"
            + "      letter-spacing: 0.04em;\n"
            + "    }\n"
            + "    .legend {\n"
            + "      display: flex;\n"
            + "      justify-content: center;\n"
            + "      gap: 1.5rem;\n"
            + "      flex-wrap: wrap;\n"
            + "      margin: 2.5rem auto 0;\n"
            + "      max-width: 600px;\n"
            + "    }\n"
            + "    .legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #64748b; }\n"
            + "    .legend-dot { width: 10px; height: 10px; border-radius: 3px; }\n"
            + "    footer { text-align: center; margin-top: 3rem; color: #334155; font-size: 0.78rem; }\n"
            + "  </style>\n"
            + "</head>\n"
            + "<body>\n"
            + "  <header>\n"
            + "    <div class=\"badge\">Live Prices &bull; India</div>\n"
            + "    <h1>Fuel Price Dashboard</h1>\n"
            + "    <p>Petrol &amp; Diesel prices across major Indian cities &bull; {{TODAY}}</p>\n"
            + "  </header>\n"
            + "  <div class=\"grid\">{{CARDS}}</div>\n"
            + "  <div class=\"legend\">\n"
            + "    <div class=\"legend-item\"><div class=\"legend-dot\" style=\"background:#22c55e\"></div> Best price</div>\n"
            + "    <div class=\"legend-item\"><div class=\"legend-dot\" style=\"background:#f59e0b\"></div> Average price</div>\n"
            + "    <div class=\"legend-item\"><div class=\"legend-dot\" style=\"background:#ef4444\"></div> High price</div>\n"
            + "    <div class=\"legend-item\">&#x1F604; Cheap &nbsp; &#x1F610; Average &nbsp; &#x1F62C; Expensive</div>\n"
            + "  </div>\n"
            + "  <footer>Data refreshed daily &bull; Prices in INR per litre &bull; For informational purposes only</footer>\n"
            + "</body>\n"
            + "</html>\n";

    private final FuelPriceService fuelPriceService;

    public DashboardController(FuelPriceService fuelPriceService) {
        this.fuelPriceService = fuelPriceService;
    }

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String dashboard() {
        StringBuilder cards = new StringBuilder();

        for (int i = 0; i < CITIES.size(); i++) {
            String city = CITIES.get(i);
            String icon = CITY_ICONS[i];
            FuelPrice petrol = fuelPriceService.getPetrolPrice(city);
            FuelPrice diesel = fuelPriceService.getDieselPrice(city);

            String petrolEmoji = priceEmoji(petrol.pricePerLitre(), 95.0, 115.0);
            String dieselEmoji = priceEmoji(diesel.pricePerLitre(), 85.0, 102.0);
            String petrolBadgeColor = priceBadgeColor(petrol.pricePerLitre(), 95.0, 115.0);
            String dieselBadgeColor = priceBadgeColor(diesel.pricePerLitre(), 85.0, 102.0);

            cards.append("<div class=\"card\">")
                 .append("<div class=\"card-header\">")
                 .append("<span class=\"city-icon\">").append(icon).append("</span>")
                 .append("<h2 class=\"city-name\">").append(petrol.city()).append("</h2>")
                 .append("</div>")
                 .append("<div class=\"fuel-row\">")
                 .append("<div class=\"fuel-label\"><span class=\"dot petrol-dot\"></span>Petrol</div>")
                 .append("<div class=\"fuel-price-block\">")
                 .append("<span class=\"price-badge\" style=\"background:").append(petrolBadgeColor).append("\">")
                 .append(String.format("&#8377; %.2f", petrol.pricePerLitre())).append("</span>")
                 .append("<span class=\"price-emoji\">").append(petrolEmoji).append("</span>")
                 .append("</div></div>")
                 .append("<div class=\"fuel-row\">")
                 .append("<div class=\"fuel-label\"><span class=\"dot diesel-dot\"></span>Diesel</div>")
                 .append("<div class=\"fuel-price-block\">")
                 .append("<span class=\"price-badge\" style=\"background:").append(dieselBadgeColor).append("\">")
                 .append(String.format("&#8377; %.2f", diesel.pricePerLitre())).append("</span>")
                 .append("<span class=\"price-emoji\">").append(dieselEmoji).append("</span>")
                 .append("</div></div>")
                 .append("<div class=\"card-footer\">per litre &bull; INR</div>")
                 .append("</div>");
        }

        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));

        return HTML_TEMPLATE
                .replace("{{TODAY}}", today)
                .replace("{{CARDS}}", cards.toString());
    }

    /** Maps a price within [min, max] to a green/amber/red hex background. */
    private String priceBadgeColor(double price, double min, double max) {
        double ratio = (price - min) / (max - min);
        if (ratio < 0.35) return "#166534";
        if (ratio < 0.65) return "#92400e";
        return "#7f1d1d";
    }

    /** Maps a price within [min, max] to a descriptive emoji. */
    private String priceEmoji(double price, double min, double max) {
        double ratio = (price - min) / (max - min);
        if (ratio < 0.35) return "😄";
        if (ratio < 0.65) return "😐";
        return "😬";
    }
}
