const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

class NotificationService {
  constructor(config) {
    this.config = config.notifications || {};
    this.logFilePath = this.config.logFile?.path
      ? path.resolve(this.config.logFile.path)
      : null;
  }

  async notify(event) {
    const message = this.formatMessage(event);
    const results = [];

    if (this.config.console !== false) {
      results.push(this.sendConsole(message));
    }

    if (this.config.webhook?.enabled && this.config.webhook?.url) {
      results.push(this.sendWebhook(event));
    }

    if (this.config.logFile?.enabled && this.logFilePath) {
      results.push(this.writeLog(event));
    }

    const settled = await Promise.allSettled(results);
    const failures = settled.filter((r) => r.status === "rejected");

    if (failures.length > 0) {
      console.error(
        `[notifications] ${failures.length} notification(s) failed to deliver`
      );
    }

    return { delivered: settled.length - failures.length, failed: failures.length };
  }

  formatMessage(event) {
    const timestamp = new Date().toISOString();

    switch (event.type) {
      case "deal_found":
        return `[${timestamp}] DEAL FOUND: ${event.listing.title} on ${event.listing.platform} for $${event.listing.price} (target: $${event.target.maxPrice})`;

      case "purchase_success":
        return `[${timestamp}] PURCHASED: ${event.listing.title} on ${event.listing.platform} for $${event.listing.price}`;

      case "purchase_failed":
        return `[${timestamp}] PURCHASE FAILED: ${event.listing.title} - ${event.error}`;

      case "scan_complete":
        return `[${timestamp}] Scan complete: ${event.listingsFound} listings found across ${event.platformsScanned} platforms`;

      case "monitoring_started":
        return `[${timestamp}] Monitoring started for ${event.targetCount} target(s) across ${event.platformCount} platform(s)`;

      default:
        return `[${timestamp}] ${event.type}: ${JSON.stringify(event)}`;
    }
  }

  sendConsole(message) {
    console.log(message);
    return Promise.resolve();
  }

  sendWebhook(event) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.webhook.url);
      const data = JSON.stringify({
        text: this.formatMessage(event),
        event,
        timestamp: new Date().toISOString(),
      });

      const transport = url.protocol === "https:" ? https : http;
      const req = transport.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
          },
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Webhook returned status ${res.statusCode}`));
          }
          res.resume();
        }
      );

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Webhook request timed out"));
      });
      req.write(data);
      req.end();
    });
  }

  writeLog(event) {
    const line = this.formatMessage(event) + "\n";
    return fs.promises.appendFile(this.logFilePath, line, "utf-8");
  }
}

module.exports = { NotificationService };
