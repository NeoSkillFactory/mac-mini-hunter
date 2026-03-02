const { describe, it } = require("node:test");
const assert = require("node:assert");
const { EbayPlatform } = require("../scripts/platforms/ebay");
const { BackMarketPlatform } = require("../scripts/platforms/backmarket");
const { SwappaPlatform } = require("../scripts/platforms/swappa");

const target = { model: "Mac Mini M1", maxPrice: 400, condition: "good" };

describe("EbayPlatform", () => {
  it("returns simulated listings without API key", async () => {
    const platform = new EbayPlatform({ enabled: true });
    const listings = await platform.search(target);
    assert.ok(Array.isArray(listings));
    assert.ok(listings.length > 0);
    listings.forEach((listing) => {
      assert.strictEqual(listing.platform, "ebay");
      assert.ok(typeof listing.price === "number");
      assert.ok(typeof listing.title === "string");
      assert.ok(listing.id);
    });
  });

  it("simulated listings respect model name", async () => {
    const platform = new EbayPlatform({ enabled: true });
    const listings = await platform.search({ model: "Mac Mini M2", maxPrice: 500, condition: "good" });
    assert.ok(listings.some((l) => l.title.includes("Mac Mini M2")));
  });

  it("purchase returns simulated result without API key", async () => {
    const platform = new EbayPlatform({ enabled: true });
    const result = await platform.purchase({ title: "Test", price: 300 }, {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.simulated, true);
  });
});

describe("BackMarketPlatform", () => {
  it("returns simulated listings without API key", async () => {
    const platform = new BackMarketPlatform({ enabled: true });
    const listings = await platform.search(target);
    assert.ok(Array.isArray(listings));
    assert.ok(listings.length > 0);
    listings.forEach((listing) => {
      assert.strictEqual(listing.platform, "backmarket");
      assert.ok(typeof listing.price === "number");
    });
  });

  it("purchase returns simulated result without API key", async () => {
    const platform = new BackMarketPlatform({ enabled: true });
    const result = await platform.purchase({ title: "Test", price: 300 }, {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.simulated, true);
  });
});

describe("SwappaPlatform", () => {
  it("returns simulated listings without API key", async () => {
    const platform = new SwappaPlatform({ enabled: true });
    const listings = await platform.search(target);
    assert.ok(Array.isArray(listings));
    assert.ok(listings.length > 0);
    listings.forEach((listing) => {
      assert.strictEqual(listing.platform, "swappa");
      assert.ok(typeof listing.price === "number");
    });
  });

  it("purchase returns simulated result without API key", async () => {
    const platform = new SwappaPlatform({ enabled: true });
    const result = await platform.purchase({ title: "Test", price: 300 }, {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.simulated, true);
  });
});
