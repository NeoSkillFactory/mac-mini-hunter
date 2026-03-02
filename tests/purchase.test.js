const { describe, it } = require("node:test");
const assert = require("node:assert");
const { PurchaseManager } = require("../scripts/purchase");
const { DEFAULT_CONFIG } = require("../scripts/config");

function makeManager(overrides = {}) {
  const config = structuredClone(DEFAULT_CONFIG);
  Object.assign(config.monitoring, overrides.monitoring || {});
  Object.assign(config.payment, overrides.payment || {});
  return new PurchaseManager(config);
}

const fakeListing = {
  id: "test-1",
  title: "Mac Mini M1 8GB",
  price: 350,
  platform: "ebay",
  url: "https://example.com/1",
  seller: "test_seller",
};

const fakePlatform = {
  purchase: async () => ({ success: false, simulated: true, message: "simulated" }),
};

describe("PurchaseManager", () => {
  describe("canPurchase", () => {
    it("denies when autoPurchase is off", () => {
      const pm = makeManager();
      const result = pm.canPurchase();
      assert.strictEqual(result.allowed, false);
      assert.ok(result.reason.includes("disabled"));
    });

    it("denies when payment not configured", () => {
      const pm = makeManager({ monitoring: { autoPurchase: true } });
      const result = pm.canPurchase();
      assert.strictEqual(result.allowed, false);
      assert.ok(result.reason.includes("Payment"));
    });

    it("allows when auto + payment configured", () => {
      const pm = makeManager({
        monitoring: { autoPurchase: true },
        payment: { configured: true },
      });
      const result = pm.canPurchase();
      assert.strictEqual(result.allowed, true);
    });

    it("denies when daily limit reached", () => {
      const pm = makeManager({
        monitoring: { autoPurchase: true, maxPurchasesPerDay: 1 },
        payment: { configured: true },
      });
      pm.purchasesToday = 1;
      const result = pm.canPurchase();
      assert.strictEqual(result.allowed, false);
      assert.ok(result.reason.includes("limit"));
    });
  });

  describe("executePurchase", () => {
    it("records dry run", async () => {
      const pm = makeManager();
      const result = await pm.executePurchase(fakeListing, fakePlatform, true);
      assert.strictEqual(result.dryRun, true);
      assert.ok(result.message.includes("DRY RUN"));
      assert.strictEqual(pm.getHistory().length, 1);
      assert.strictEqual(pm.getHistory()[0].status, "dry_run");
    });

    it("skips when not allowed", async () => {
      const pm = makeManager();
      const result = await pm.executePurchase(fakeListing, fakePlatform, false);
      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes("skipped"));
    });

    it("records simulated purchase when allowed", async () => {
      const pm = makeManager({
        monitoring: { autoPurchase: true },
        payment: { configured: true },
      });
      const result = await pm.executePurchase(fakeListing, fakePlatform, false);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.record.status, "simulated");
    });

    it("handles platform errors", async () => {
      const errorPlatform = {
        purchase: async () => { throw new Error("network failure"); },
      };
      const pm = makeManager({
        monitoring: { autoPurchase: true },
        payment: { configured: true },
      });
      const result = await pm.executePurchase(fakeListing, errorPlatform, false);
      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes("network failure"));
      assert.strictEqual(result.record.status, "error");
    });
  });

  describe("getSummary", () => {
    it("returns correct summary", async () => {
      const pm = makeManager();
      await pm.executePurchase(fakeListing, fakePlatform, true);
      await pm.executePurchase(fakeListing, fakePlatform, true);
      const summary = pm.getSummary();
      assert.strictEqual(summary.totalAttempts, 2);
      assert.strictEqual(summary.completed, 0);
      assert.strictEqual(summary.totalSpent, 0);
    });
  });
});
