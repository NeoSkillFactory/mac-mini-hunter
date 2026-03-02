const { describe, it } = require("node:test");
const assert = require("node:assert");
const { MacMiniHunter } = require("../scripts/monitor");
const { DEFAULT_CONFIG } = require("../scripts/config");

describe("MacMiniHunter", () => {
  it("initializes with default config", () => {
    const hunter = new MacMiniHunter(DEFAULT_CONFIG, { dryRun: true, once: true });
    assert.strictEqual(hunter.dryRun, true);
    assert.strictEqual(hunter.once, true);
    assert.ok(hunter.platforms.ebay);
    assert.ok(hunter.platforms.backmarket);
    assert.ok(hunter.platforms.swappa);
  });

  it("respects disabled platforms", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.platforms.swappa.enabled = false;
    const hunter = new MacMiniHunter(config, { dryRun: true, once: true });
    assert.ok(hunter.platforms.ebay);
    assert.ok(hunter.platforms.backmarket);
    assert.strictEqual(hunter.platforms.swappa, undefined);
  });

  it("runs a full scan in dry-run mode", async () => {
    const hunter = new MacMiniHunter(DEFAULT_CONFIG, { dryRun: true, once: true });
    await hunter.start();
    assert.strictEqual(hunter.scanCount, 1);
    const summary = hunter.purchaseManager.getSummary();
    assert.ok(summary.totalAttempts > 0);
    assert.strictEqual(summary.completed, 0);
  });
});
