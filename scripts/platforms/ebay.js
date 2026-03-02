const https = require("https");

const EBAY_SEARCH_TERMS = {
  "Mac Mini M1": "Apple Mac Mini M1 2020",
  "Mac Mini M2": "Apple Mac Mini M2 2023",
  "Mac Mini M2 Pro": "Apple Mac Mini M2 Pro 2023",
  "Mac Mini Intel": "Apple Mac Mini Intel 2018 2020",
  "Mac Mini": "Apple Mac Mini",
};

const CONDITION_MAP = {
  any: [],
  fair: ["3000"],
  good: ["3000", "2500"],
  excellent: ["2500", "1000"],
};

class EbayPlatform {
  constructor(platformConfig) {
    this.apiKey = platformConfig.apiKey || process.env.EBAY_API_KEY || "";
    this.marketplace = platformConfig.marketplace || "EBAY_US";
    this.name = "ebay";
    this.rateLimitDelay = 1000;
  }

  async search(target) {
    if (!this.apiKey) {
      return this.getSimulatedListings(target);
    }

    return this.searchApi(target);
  }

  async searchApi(target) {
    const query = EBAY_SEARCH_TERMS[target.model] || target.model;
    const params = new URLSearchParams({
      q: query,
      limit: "50",
      filter: `price:[..${target.maxPrice}],priceCurrency:USD`,
    });

    const conditionIds = CONDITION_MAP[target.condition] || [];
    if (conditionIds.length > 0) {
      params.append("filter", `conditionIds:{${conditionIds.join("|")}}`);
    }

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: "api.ebay.com",
          path: `/buy/browse/v1/item_summary/search?${params.toString()}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-EBAY-C-MARKETPLACE-ID": this.marketplace,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode !== 200) {
              console.warn(
                `[ebay] API returned status ${res.statusCode}, falling back to simulated data`
              );
              resolve(this.getSimulatedListings(target));
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const listings = (parsed.itemSummaries || []).map((item) =>
                this.normalizeItem(item)
              );
              resolve(listings);
            } catch (err) {
              reject(new Error(`Failed to parse eBay response: ${err.message}`));
            }
          });
        }
      );

      req.on("error", (err) => {
        console.warn(`[ebay] API error: ${err.message}, using simulated data`);
        resolve(this.getSimulatedListings(target));
      });

      req.on("timeout", () => {
        req.destroy();
        console.warn("[ebay] API timeout, using simulated data");
        resolve(this.getSimulatedListings(target));
      });

      req.end();
    });
  }

  normalizeItem(item) {
    return {
      id: item.itemId,
      title: item.title,
      price: parseFloat(item.price?.value || "0"),
      currency: item.price?.currency || "USD",
      condition: item.condition || "Unknown",
      url: item.itemWebUrl || item.itemHref || "",
      platform: "ebay",
      seller: item.seller?.username || "unknown",
      imageUrl: item.thumbnailImages?.[0]?.imageUrl || "",
      listedAt: new Date().toISOString(),
    };
  }

  getSimulatedListings(target) {
    const basePrice = target.maxPrice;
    const modelName = target.model || "Mac Mini";

    const listings = [
      {
        id: `ebay-sim-${Date.now()}-1`,
        title: `Apple ${modelName} 8GB 256GB SSD - ${target.condition || "Good"} Condition`,
        price: Math.round(basePrice * 0.85),
        currency: "USD",
        condition: target.condition || "good",
        url: "https://www.ebay.com/itm/simulated-1",
        platform: "ebay",
        seller: "tech_deals_usa",
        imageUrl: "",
        listedAt: new Date().toISOString(),
      },
      {
        id: `ebay-sim-${Date.now()}-2`,
        title: `${modelName} 16GB 512GB - Refurbished`,
        price: Math.round(basePrice * 1.1),
        currency: "USD",
        condition: "excellent",
        url: "https://www.ebay.com/itm/simulated-2",
        platform: "ebay",
        seller: "apple_refurb_store",
        imageUrl: "",
        listedAt: new Date().toISOString(),
      },
      {
        id: `ebay-sim-${Date.now()}-3`,
        title: `${modelName} 8GB 512GB SSD - Used`,
        price: Math.round(basePrice * 0.72),
        currency: "USD",
        condition: "fair",
        url: "https://www.ebay.com/itm/simulated-3",
        platform: "ebay",
        seller: "bargain_macs",
        imageUrl: "",
        listedAt: new Date().toISOString(),
      },
    ];

    return listings;
  }

  async purchase(listing, paymentConfig) {
    console.log(
      `[ebay] Purchase requested for: ${listing.title} at $${listing.price}`
    );

    if (!this.apiKey) {
      return {
        success: false,
        simulated: true,
        message:
          "Simulated mode - no API key configured. In production, this would initiate checkout via eBay API.",
        listing,
      };
    }

    return {
      success: false,
      message:
        "eBay Buy API purchase not implemented - requires OAuth user token with buy.order scope",
      listing,
    };
  }
}

module.exports = { EbayPlatform };
