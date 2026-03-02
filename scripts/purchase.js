const fs = require("fs");
const path = require("path");

class PurchaseManager {
  constructor(config) {
    this.config = config;
    this.autoPurchase = config.monitoring?.autoPurchase || false;
    this.maxPurchasesPerDay = config.monitoring?.maxPurchasesPerDay || 3;
    this.paymentConfigured = config.payment?.configured || false;
    this.purchasesToday = 0;
    this.purchaseHistory = [];
    this.lastResetDate = this.todayString();
  }

  todayString() {
    return new Date().toISOString().split("T")[0];
  }

  resetDailyCounterIfNeeded() {
    const today = this.todayString();
    if (today !== this.lastResetDate) {
      this.purchasesToday = 0;
      this.lastResetDate = today;
    }
  }

  canPurchase() {
    this.resetDailyCounterIfNeeded();

    if (!this.autoPurchase) {
      return { allowed: false, reason: "Auto-purchase is disabled in config" };
    }

    if (!this.paymentConfigured) {
      return { allowed: false, reason: "Payment method not configured" };
    }

    if (this.purchasesToday >= this.maxPurchasesPerDay) {
      return {
        allowed: false,
        reason: `Daily purchase limit reached (${this.maxPurchasesPerDay})`,
      };
    }

    return { allowed: true, reason: "" };
  }

  async executePurchase(listing, platform, dryRun) {
    const canBuy = this.canPurchase();

    if (dryRun) {
      const record = this.recordPurchase(listing, "dry_run", "Dry run - no purchase executed");
      return {
        success: false,
        dryRun: true,
        message: `[DRY RUN] Would purchase: ${listing.title} for $${listing.price} on ${listing.platform}`,
        record,
      };
    }

    if (!canBuy.allowed) {
      const record = this.recordPurchase(listing, "skipped", canBuy.reason);
      return {
        success: false,
        message: `Purchase skipped: ${canBuy.reason}`,
        record,
      };
    }

    try {
      const result = await platform.purchase(listing, this.config.payment);

      if (result.success) {
        this.purchasesToday++;
        const record = this.recordPurchase(listing, "completed", "Purchase successful");
        return { success: true, message: "Purchase completed", record, platformResult: result };
      }

      const record = this.recordPurchase(
        listing,
        result.simulated ? "simulated" : "failed",
        result.message
      );
      return { success: false, message: result.message, record, platformResult: result };
    } catch (err) {
      const record = this.recordPurchase(listing, "error", err.message);
      return { success: false, message: `Purchase error: ${err.message}`, record };
    }
  }

  recordPurchase(listing, status, notes) {
    const record = {
      timestamp: new Date().toISOString(),
      listing: {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        platform: listing.platform,
        url: listing.url,
        seller: listing.seller,
      },
      status,
      notes,
    };

    this.purchaseHistory.push(record);
    return record;
  }

  getHistory() {
    return this.purchaseHistory;
  }

  getSummary() {
    const completed = this.purchaseHistory.filter(
      (r) => r.status === "completed"
    );
    const totalSpent = completed.reduce(
      (sum, r) => sum + (r.listing.price || 0),
      0
    );

    return {
      totalAttempts: this.purchaseHistory.length,
      completed: completed.length,
      totalSpent,
      purchasesToday: this.purchasesToday,
      maxPurchasesPerDay: this.maxPurchasesPerDay,
      autoPurchase: this.autoPurchase,
      paymentConfigured: this.paymentConfigured,
    };
  }
}

module.exports = { PurchaseManager };
