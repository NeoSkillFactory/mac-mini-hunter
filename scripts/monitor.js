const { loadConfig, parseArgs, validateConfig } = require("./config");
const { NotificationService } = require("./notifications");
const { PurchaseManager } = require("./purchase");
const { EbayPlatform } = require("./platforms/ebay");
const { BackMarketPlatform } = require("./platforms/backmarket");
const { SwappaPlatform } = require("./platforms/swappa");

const PLATFORM_CLASSES = {
  ebay: EbayPlatform,
  backmarket: BackMarketPlatform,
  swappa: SwappaPlatform,
};

class MacMiniHunter {
  constructor(config, options = {}) {
    this.config = config;
    this.dryRun = options.dryRun || false;
    this.once = options.once || false;
    this.notifications = new NotificationService(config);
    this.purchaseManager = new PurchaseManager(config);
    this.platforms = this.initPlatforms();
    this.running = false;
    this.scanCount = 0;
  }

  initPlatforms() {
    const platforms = {};

    for (const [name, PlatformClass] of Object.entries(PLATFORM_CLASSES)) {
      const platformConfig = this.config.platforms[name] || {};
      if (platformConfig.enabled !== false) {
        platforms[name] = new PlatformClass(platformConfig);
      }
    }

    return platforms;
  }

  async start() {
    this.running = true;

    const enabledPlatforms = Object.keys(this.platforms);
    console.log("\n=== mac-mini-hunter ===");
    console.log(`Mode: ${this.dryRun ? "DRY RUN" : "LIVE"}`);
    console.log(`Targets: ${this.config.targets.length}`);
    console.log(`Platforms: ${enabledPlatforms.join(", ")}`);
    console.log(`Interval: ${this.config.monitoring.intervalSeconds}s`);
    console.log(`Auto-purchase: ${this.config.monitoring.autoPurchase ? "ON" : "OFF"}`);
    console.log("========================\n");

    await this.notifications.notify({
      type: "monitoring_started",
      targetCount: this.config.targets.length,
      platformCount: enabledPlatforms.length,
    });

    if (this.once) {
      await this.scan();
      this.printSummary();
      return;
    }

    await this.scan();
    this.printSummary();

    const interval = this.config.monitoring.intervalSeconds * 1000;
    const timer = setInterval(async () => {
      if (!this.running) {
        clearInterval(timer);
        return;
      }
      await this.scan();
    }, interval);

    process.on("SIGINT", () => {
      console.log("\n[monitor] Shutting down...");
      this.running = false;
      clearInterval(timer);
      this.printSummary();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      this.running = false;
      clearInterval(timer);
    });
  }

  async scan() {
    this.scanCount++;
    console.log(`\n[monitor] Starting scan #${this.scanCount}...`);

    let totalListings = 0;
    let platformsScanned = 0;
    const deals = [];

    for (const target of this.config.targets) {
      const targetPlatforms = target.platforms || Object.keys(this.platforms);

      for (const platformName of targetPlatforms) {
        const platform = this.platforms[platformName];
        if (!platform) continue;

        try {
          const listings = await platform.search(target);
          platformsScanned++;
          totalListings += listings.length;

          const matching = listings.filter(
            (listing) => listing.price <= target.maxPrice && listing.price > 0
          );

          for (const listing of matching) {
            deals.push({ listing, target, platformName });

            await this.notifications.notify({
              type: "deal_found",
              listing,
              target,
            });
          }

          if (platform.rateLimitDelay) {
            await this.sleep(platform.rateLimitDelay);
          }
        } catch (err) {
          console.error(
            `[monitor] Error scanning ${platformName} for ${target.model}: ${err.message}`
          );
        }
      }
    }

    await this.notifications.notify({
      type: "scan_complete",
      listingsFound: totalListings,
      platformsScanned,
    });

    if (deals.length > 0) {
      console.log(`[monitor] Found ${deals.length} deal(s) below threshold!`);
      await this.handleDeals(deals);
    } else {
      console.log("[monitor] No deals found below threshold in this scan.");
    }
  }

  async handleDeals(deals) {
    deals.sort((a, b) => a.listing.price - b.listing.price);

    for (const deal of deals) {
      const platform = this.platforms[deal.platformName];
      const result = await this.purchaseManager.executePurchase(
        deal.listing,
        platform,
        this.dryRun
      );

      console.log(`  ${result.message}`);

      if (result.success) {
        await this.notifications.notify({
          type: "purchase_success",
          listing: deal.listing,
        });
      } else if (result.record?.status === "error" || result.record?.status === "failed") {
        await this.notifications.notify({
          type: "purchase_failed",
          listing: deal.listing,
          error: result.message,
        });
      }
    }
  }

  printSummary() {
    const summary = this.purchaseManager.getSummary();
    console.log("\n=== Session Summary ===");
    console.log(`Scans completed: ${this.scanCount}`);
    console.log(`Purchase attempts: ${summary.totalAttempts}`);
    console.log(`Successful purchases: ${summary.completed}`);
    console.log(`Total spent: $${summary.totalSpent}`);
    console.log("========================\n");
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig(args.configPath);
  const validation = validateConfig(config);

  if (!validation.valid) {
    console.error("[config] Validation errors:");
    for (const err of validation.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const hunter = new MacMiniHunter(config, {
    dryRun: args.dryRun,
    once: args.once,
  });

  await hunter.start();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[monitor] Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { MacMiniHunter };
