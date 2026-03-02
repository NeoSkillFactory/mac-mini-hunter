const { describe, it } = require("node:test");
const assert = require("node:assert");
const { loadConfig, parseArgs, validateConfig, mergeConfig, DEFAULT_CONFIG } = require("../scripts/config");

describe("parseArgs", () => {
  it("returns defaults with no args", () => {
    const args = parseArgs(["node", "monitor.js"]);
    assert.strictEqual(args.configPath, null);
    assert.strictEqual(args.dryRun, false);
    assert.strictEqual(args.once, false);
  });

  it("parses --dry-run", () => {
    const args = parseArgs(["node", "monitor.js", "--dry-run"]);
    assert.strictEqual(args.dryRun, true);
  });

  it("parses --once", () => {
    const args = parseArgs(["node", "monitor.js", "--once"]);
    assert.strictEqual(args.once, true);
  });

  it("parses --config with path", () => {
    const args = parseArgs(["node", "monitor.js", "--config", "/tmp/test.yaml"]);
    assert.strictEqual(args.configPath, "/tmp/test.yaml");
  });

  it("parses multiple flags", () => {
    const args = parseArgs(["node", "monitor.js", "--dry-run", "--once", "--config", "/tmp/c.yaml"]);
    assert.strictEqual(args.dryRun, true);
    assert.strictEqual(args.once, true);
    assert.strictEqual(args.configPath, "/tmp/c.yaml");
  });
});

describe("loadConfig", () => {
  it("returns defaults when config file missing", () => {
    const config = loadConfig("/tmp/nonexistent-config-12345.yaml");
    assert.deepStrictEqual(config.targets, DEFAULT_CONFIG.targets);
    assert.strictEqual(config.monitoring.intervalSeconds, 300);
  });
});

describe("mergeConfig", () => {
  it("overrides targets", () => {
    const merged = mergeConfig(DEFAULT_CONFIG, {
      targets: [{ model: "Mac Mini M2", maxPrice: 500 }],
    });
    assert.strictEqual(merged.targets.length, 1);
    assert.strictEqual(merged.targets[0].model, "Mac Mini M2");
    assert.strictEqual(merged.targets[0].maxPrice, 500);
  });

  it("merges platform settings", () => {
    const merged = mergeConfig(DEFAULT_CONFIG, {
      platforms: { ebay: { apiKey: "test-key" } },
    });
    assert.strictEqual(merged.platforms.ebay.apiKey, "test-key");
    assert.strictEqual(merged.platforms.ebay.enabled, true);
  });

  it("handles null overrides", () => {
    const merged = mergeConfig(DEFAULT_CONFIG, null);
    assert.deepStrictEqual(merged.targets, DEFAULT_CONFIG.targets);
  });
});

describe("validateConfig", () => {
  it("validates default config", () => {
    const result = validateConfig(DEFAULT_CONFIG);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it("rejects empty targets", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.targets = [];
    const result = validateConfig(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("target")));
  });

  it("rejects negative maxPrice", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.targets[0].maxPrice = -10;
    const result = validateConfig(config);
    assert.strictEqual(result.valid, false);
  });

  it("rejects invalid condition", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.targets[0].condition = "broken";
    const result = validateConfig(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("condition")));
  });

  it("rejects interval below 30s", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.monitoring.intervalSeconds = 5;
    const result = validateConfig(config);
    assert.strictEqual(result.valid, false);
  });
});
