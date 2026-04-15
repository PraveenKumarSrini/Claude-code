import { describe, it, expect, beforeEach } from "vitest";
import { shorten, resolve } from "./shortener";

describe("URL Shortener", () => {
  // Reset state between tests so each test is isolated
  beforeEach(() => {
    // Tests rely on module-level store being cleared between runs.
    // If the implementation exports a reset(), call it here.
    // For now tests are designed to be order-independent via unique URLs.
  });

  // ---------------------------------------------------------------------------
  // URL Validation — valid URLs accepted
  // ---------------------------------------------------------------------------
  describe("valid URL acceptance", () => {
    it("accepts a standard https URL", () => {
      expect(() => shorten("https://example.com")).not.toThrow();
    });

    it("accepts a standard http URL", () => {
      expect(() => shorten("http://example.com")).not.toThrow();
    });

    it("accepts a URL with a path", () => {
      expect(() => shorten("https://example.com/some/deep/path")).not.toThrow();
    });

    it("accepts a URL with query parameters", () => {
      expect(() =>
        shorten("https://example.com/search?q=hello&lang=en")
      ).not.toThrow();
    });

    it("accepts a URL with a fragment", () => {
      expect(() =>
        shorten("https://example.com/page#section-2")
      ).not.toThrow();
    });

    it("accepts a URL with a port number", () => {
      expect(() => shorten("https://example.com:8080/api")).not.toThrow();
    });

    it("accepts a URL with a subdomain", () => {
      expect(() => shorten("https://blog.example.co.uk/post/1")).not.toThrow();
    });

    it("accepts a URL with basic auth credentials", () => {
      expect(() =>
        shorten("https://user:pass@example.com/secure")
      ).not.toThrow();
    });

    it("accepts a URL exactly at the 2048-character limit", () => {
      const base = "https://example.com/";
      const longPath = "a".repeat(2048 - base.length);
      const longUrl = base + longPath;
      expect(longUrl.length).toBe(2048);
      expect(() => shorten(longUrl)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // URL Validation — invalid URLs rejected with an error
  // ---------------------------------------------------------------------------
  describe("invalid URL rejection", () => {
    it("rejects an empty string", () => {
      expect(() => shorten("")).toThrow();
    });

    it("rejects a URL missing a protocol", () => {
      expect(() => shorten("example.com/path")).toThrow();
    });

    it("rejects a URL with only a protocol and no host", () => {
      expect(() => shorten("https://")).toThrow();
    });

    it("rejects plain text that is not a URL", () => {
      expect(() => shorten("not a url at all")).toThrow();
    });

    it("rejects a URL that is too long (over 2048 characters)", () => {
      const tooLong = "https://example.com/" + "a".repeat(2030);
      expect(tooLong.length).toBeGreaterThan(2048);
      expect(() => shorten(tooLong)).toThrow();
    });

    it("rejects ftp:// protocol (only http/https allowed)", () => {
      expect(() => shorten("ftp://files.example.com/file.txt")).toThrow();
    });

    it("rejects a URL with spaces", () => {
      expect(() => shorten("https://example.com/path with spaces")).toThrow();
    });

    it("throws an Error instance with a descriptive message", () => {
      expect(() => shorten("")).toThrowError(/invalid url/i);
    });
  });

  // ---------------------------------------------------------------------------
  // Short code generation — format
  // ---------------------------------------------------------------------------
  describe("short code format", () => {
    it("returns a string", () => {
      const code = shorten("https://format-test.example.com");
      expect(typeof code).toBe("string");
    });

    it("returns exactly 6 characters", () => {
      const code = shorten("https://length-test.example.com");
      expect(code).toHaveLength(6);
    });

    it("contains only alphanumeric characters [A-Za-z0-9]", () => {
      const code = shorten("https://alphanumeric-test.example.com");
      expect(code).toMatch(/^[A-Za-z0-9]{6}$/);
    });

    it("generates different codes for different URLs", () => {
      const code1 = shorten("https://unique-a.example.com");
      const code2 = shorten("https://unique-b.example.com");
      expect(code1).not.toBe(code2);
    });
  });

  // ---------------------------------------------------------------------------
  // URL retrieval by short code
  // ---------------------------------------------------------------------------
  describe("URL retrieval (resolve)", () => {
    it("returns the original URL for a valid code", () => {
      const url = "https://retrieve-test.example.com/path";
      const code = shorten(url);
      expect(resolve(code)).toBe(url);
    });

    it("returns null for an unknown code", () => {
      expect(resolve("xxxxxx")).toBeNull();
    });

    it("returns null for an empty string code", () => {
      expect(resolve("")).toBeNull();
    });

    it("is case-sensitive when looking up codes", () => {
      const url = "https://case-test.example.com";
      const code = shorten(url);
      const flipped = code === code.toUpperCase() ? code.toLowerCase() : code.toUpperCase();
      // Only assert if flipping actually changes the code
      if (flipped !== code) {
        expect(resolve(flipped)).toBeNull();
      }
    });

    it("resolves a URL with query parameters correctly", () => {
      const url = "https://query-test.example.com?foo=bar&baz=1";
      const code = shorten(url);
      expect(resolve(code)).toBe(url);
    });
  });

  // ---------------------------------------------------------------------------
  // Idempotency — same URL always returns same code
  // ---------------------------------------------------------------------------
  describe("idempotency", () => {
    it("returns the same code when shorten is called twice with the same URL", () => {
      const url = "https://idempotent-test.example.com";
      const code1 = shorten(url);
      const code2 = shorten(url);
      expect(code1).toBe(code2);
    });

    it("stores only one entry for repeated identical URLs", () => {
      const url = "https://dedup-test.example.com/page";
      shorten(url);
      shorten(url);
      shorten(url);
      const code = shorten(url);
      // All calls return the same code and resolve correctly
      expect(resolve(code)).toBe(url);
    });

    it("treats URLs with different trailing slashes as different URLs", () => {
      const url1 = "https://slash-test.example.com/page";
      const url2 = "https://slash-test.example.com/page/";
      const code1 = shorten(url1);
      const code2 = shorten(url2);
      // Different inputs must yield different codes
      expect(code1).not.toBe(code2);
    });

    it("treats http and https versions as different URLs", () => {
      const httpUrl = "http://protocol-test.example.com";
      const httpsUrl = "https://protocol-test.example.com";
      const code1 = shorten(httpUrl);
      const code2 = shorten(httpsUrl);
      expect(code1).not.toBe(code2);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  describe("edge cases", () => {
    it("handles a URL with encoded characters (%20 etc.)", () => {
      const url = "https://encoded-test.example.com/path%20with%20spaces";
      expect(() => shorten(url)).not.toThrow();
      const code = shorten(url);
      expect(resolve(code)).toBe(url);
    });

    it("handles a URL with an international domain (punycode)", () => {
      const url = "https://xn--nxasmq6b.example.com/page";
      expect(() => shorten(url)).not.toThrow();
    });

    it("handles a URL with a numeric IP address as host", () => {
      const url = "http://192.168.1.1/admin";
      expect(() => shorten(url)).not.toThrow();
    });

    it("handles a URL at exactly 2048 characters without error", () => {
      const base = "https://exact-limit.example.com/";
      const padding = "x".repeat(2048 - base.length);
      const url = base + padding;
      expect(url).toHaveLength(2048);
      const code = shorten(url);
      expect(code).toHaveLength(6);
      expect(resolve(code)).toBe(url);
    });

    it("throws when URL is 2049 characters (one over the limit)", () => {
      const base = "https://over-limit.example.com/";
      const padding = "x".repeat(2049 - base.length);
      const url = base + padding;
      expect(url).toHaveLength(2049);
      expect(() => shorten(url)).toThrow();
    });

    it("rejects null-like string input '  ' (whitespace only)", () => {
      expect(() => shorten("   ")).toThrow();
    });
  });
});
