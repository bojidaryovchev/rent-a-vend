import { afterEach, describe, expect, it } from "vitest";
import { mapEmbedSrc, mapPin, mapQuery, mapsLink } from "@/lib/company";

/**
 * The map has to fail closed.
 *
 * Every branch here exists to keep one thing from happening: a map that renders
 * confidently at the wrong place, or an iframe that reaches Google before a
 * visitor has agreed to it. Both are silent failures - the page still looks
 * finished - so they are worth pinning down in tests rather than in review.
 */

const KEY = "NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY";

const pristine = { ...mapPin };
const originalKey = process.env[KEY];

/**
 * Each case sets the pin it is testing rather than leaning on the shipped one.
 * These branches outlive any particular location - the empty-pin cases have to
 * keep passing on a day when the site has a location, or they are only testing
 * what happens to be in the file this week.
 */
const setPin = (fields: Partial<typeof mapPin>) =>
  Object.assign(mapPin, { lat: null, lng: null, address: null }, fields);

afterEach(() => {
  Object.assign(mapPin, pristine);
  if (originalKey === undefined) delete process.env[KEY];
  else process.env[KEY] = originalKey;
});

describe("the shipped pin", () => {
  it("points at the warehouse on Околовръстен път, not at Марково centre", () => {
    // The address alone geocodes ~2.8km south, into the village. If these ever
    // drift back toward 42.064, 24.706 the map is pointing at the wrong place.
    expect(mapPin.lat).toBeCloseTo(42.0893, 3);
    expect(mapPin.lng).toBeCloseTo(24.6997, 3);
  });

  it("prints an address that leads with the road a driver needs", () => {
    expect(mapPin.address).toContain("Околовръстен път 86");
  });
});

describe("mapQuery", () => {
  it("is null while the location is unknown", () => {
    setPin({});
    expect(mapQuery()).toBeNull();
  });

  it("prefers coordinates over the address", () => {
    setPin({ lat: 42.0934, lng: 24.7163, address: "с. Марково" });
    expect(mapQuery()).toBe("42.0934,24.7163");
  });

  it("falls back to the address when only that is known", () => {
    setPin({ address: "с. Марково" });
    expect(mapQuery()).toBe("с. Марково");
  });

  it("treats an unresolved marker as no address at all", () => {
    setPin({ address: "[[MAP_ADDRESS]]" });
    expect(mapQuery()).toBeNull();
  });

  it("needs both halves of a coordinate pair", () => {
    setPin({ lat: 42.0934 });
    expect(mapQuery()).toBeNull();
  });
});

describe("mapsLink", () => {
  it("is null while the location is unknown", () => {
    setPin({});
    expect(mapsLink()).toBeNull();
  });

  it("percent-encodes a Cyrillic address", () => {
    setPin({ address: "с. Марково" });
    expect(mapsLink()).toBe(
      "https://www.google.com/maps/search/?api=1&query=%D1%81.%20%D0%9C%D0%B0%D1%80%D0%BA%D0%BE%D0%B2%D0%BE",
    );
  });
});

describe("mapEmbedSrc", () => {
  it("is null with a key but no location", () => {
    process.env[KEY] = "test-key";
    setPin({});
    expect(mapEmbedSrc()).toBeNull();
  });

  it("is null with a location but no key", () => {
    delete process.env[KEY];
    setPin({ lat: 42.0934, lng: 24.7163 });
    expect(mapEmbedSrc()).toBeNull();
  });

  it("builds a place embed once both are present", () => {
    process.env[KEY] = "test-key";
    setPin({ lat: 42.0934, lng: 24.7163, zoom: 17 });

    const url = new URL(mapEmbedSrc()!);
    expect(url.origin + url.pathname).toBe(
      "https://www.google.com/maps/embed/v1/place",
    );
    expect(url.searchParams.get("key")).toBe("test-key");
    expect(url.searchParams.get("q")).toBe("42.0934,24.7163");
    expect(url.searchParams.get("zoom")).toBe("17");
    expect(url.searchParams.get("language")).toBe("bg");
  });
});
