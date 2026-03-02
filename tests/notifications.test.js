const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { NotificationService } = require("../scripts/notifications");

const testLogPath = path.join(__dirname, "test-notifications.log");

afterEach(() => {
  try { fs.unlinkSync(testLogPath); } catch {}
});

describe("NotificationService", () => {
  it("formats deal_found message", () => {
    const svc = new NotificationService({ notifications: { console: false } });
    const msg = svc.formatMessage({
      type: "deal_found",
      listing: { title: "Mac Mini M1", platform: "ebay", price: 350 },
      target: { maxPrice: 400 },
    });
    assert.ok(msg.includes("DEAL FOUND"));
    assert.ok(msg.includes("Mac Mini M1"));
    assert.ok(msg.includes("350"));
  });

  it("formats purchase_success message", () => {
    const svc = new NotificationService({ notifications: { console: false } });
    const msg = svc.formatMessage({
      type: "purchase_success",
      listing: { title: "Mac Mini M2", platform: "backmarket", price: 450 },
    });
    assert.ok(msg.includes("PURCHASED"));
    assert.ok(msg.includes("Mac Mini M2"));
  });

  it("formats scan_complete message", () => {
    const svc = new NotificationService({ notifications: { console: false } });
    const msg = svc.formatMessage({
      type: "scan_complete",
      listingsFound: 10,
      platformsScanned: 3,
    });
    assert.ok(msg.includes("10"));
    assert.ok(msg.includes("3"));
  });

  it("writes to log file", async () => {
    const svc = new NotificationService({
      notifications: {
        console: false,
        logFile: { enabled: true, path: testLogPath },
      },
    });

    await svc.notify({
      type: "deal_found",
      listing: { title: "Test Mac", platform: "swappa", price: 200 },
      target: { maxPrice: 300 },
    });

    const logContent = fs.readFileSync(testLogPath, "utf-8");
    assert.ok(logContent.includes("DEAL FOUND"));
    assert.ok(logContent.includes("Test Mac"));
  });

  it("returns delivery stats", async () => {
    const svc = new NotificationService({
      notifications: { console: true, logFile: { enabled: false } },
    });
    const result = await svc.notify({
      type: "monitoring_started",
      targetCount: 1,
      platformCount: 2,
    });
    assert.strictEqual(result.failed, 0);
    assert.ok(result.delivered >= 1);
  });
});
