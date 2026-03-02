const https = require("https");

const SWAPPA_CATEGORIES = {
  "Mac Mini M1": { category: "mac-mini", query: "M1" },
  "Mac Mini M2": { category: "mac-mini", query: "M2" },
  "Mac Mini M2 Pro": { category: "mac-mini", query: "M2 Pro" },
  "Mac Mini Intel": { category: "mac-mini", query: "Intel" },
  "Mac Mini": { category: "mac-mini", query: "" },
};

const CONDITION_FILTER = {
  any: ["mint", "good", "fair"],
  fair: ["mint", "good", "fair"],
  good: ["mint", "good"],
  excellent: ["mint"],
};

class SwappaPlatform {
  constructor(platformConfig) {
    this.apiKey = platformConfig.apiKey || process.env.SWAPPA_API_KEY || "";
    this.name = "swappa";
    this.rateLimitDelay = 1500;
  }

  async search(target) {
    if (!this.apiKey) {
      return this.getSimulatedListings(target);
    }

    return this.searchApi(target);
  }

  async searchApi(target) {
    const cat = SWAPPA_CATEGORIES[target.model] || SWAPPA_CATEGORIES["Mac Mini"];
    const queryStr = cat.query
      ? `Mac Mini ${cat.query}`
      : target.model;

    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        q: queryStr,
        category: cat.category,
        price_max: String(target.maxPrice),
      });

      const req = https.request(
        {
          hostname: "api.swappa.com",
          path: `/listings/search?${params.toString()}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
          timeout: 15000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode !== 200) {
              console.warn(
                `[swappa] API returned status ${res.statusCode}, using simulated data`
              );
              resolve(this.getSimulatedListings(target));
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const listings = (parsed.listings || parsed.data || []).map(
                (item) => this.normalizeItem(item)
              );
              resolve(listings);
            } catch (err) {
              reject(
                new Error(`Failed to parse Swappa response: ${err.message}`)
              );
            }
          });
        }
      );

      req.on("error", (err) => {
        console.warn(`[swappa] API error: ${err.message}, using simulated data`);
        resolve(this.getSimulatedListings(target));
      });

      req.on("timeout", () => {
        req.destroy();
        console.warn("[swappa] API timeout, using simulated data");
        resolve(this.getSimulatedListings(target));
      });

      req.end();
    });
  }

  normalizeItem(item) {
    return {
      id: `swp-${item.id || Date.now()}`,
      title: item.title || item.name || "",
      price: parseFloat(item.price || item.asking_price || "0"),
      currency: "USD",
      condition: item.condition || "good",
      url: item.url || item.listing_url || "",
      platform: "swappa",
      seller: item.seller?.username || item.user || "unknown",
      imageUrl: item.images?.[0] || "",
      listedAt: item.created_at || new Date().toISOString(),
    };
  }

  getSimulatedListings(target) {
    const basePrice = target.maxPrice;
    const modelName = target.model || "Mac Mini";
    const conditions = CONDITION_FILTER[target.condition] || CONDITION_FILTER.any;

    const listings = [
      {
        id: `swp-sim-${Date.now()}-1`,
        title: `${modelName} 8GB 256GB - ${conditions[0]} condition`,
        price: Math.round(basePrice * 0.8),
        currency: "USD",
        condition: conditions[0],
        url: "https://swappa.com/listing/simulated-1",
        platform: "swappa",
        seller: "swapper_joe",
        imageUrl: "",
        listedAt: new Date().toISOString(),
      },
      {
        id: `swp-sim-${Date.now()}-2`,
        title: `${modelName} 16GB 512GB SSD`,
        price: Math.round(basePrice * 0.95),
        currency: "USD",
        condition: conditions[conditions.length - 1],
        url: "https://swappa.com/listing/simulated-2",
        platform: "swappa",
        seller: "mac_lover_99",
        imageUrl: "",
        listedAt: new Date().toISOString(),
      },
    ];

    return listings;
  }

  async purchase(listing, paymentConfig) {
    console.log(
      `[swappa] Purchase requested for: ${listing.title} at $${listing.price}`
    );

    if (!this.apiKey) {
      return {
        success: false,
        simulated: true,
        message:
          "Simulated mode - no API key configured. In production, this would initiate Swappa checkout.",
        listing,
      };
    }

    return {
      success: false,
      message: "Swappa does not support API-based purchasing - manual checkout required",
      listing,
    };
  }
}

module.exports = { SwappaPlatform };
