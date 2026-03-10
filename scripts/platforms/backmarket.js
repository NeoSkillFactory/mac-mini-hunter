const https = require("https");

const MODEL_SLUGS = {
  "Mac Mini M1": "mac-mini-m1-2020",
  "Mac Mini M2": "mac-mini-m2-2023",
  "Mac Mini M2 Pro": "mac-mini-m2-pro-2023",
  "Mac Mini Intel": "mac-mini-2018",
  "Mac Mini": "mac-mini",
};

const CONDITION_GRADES = {
  any: ["fair", "good", "excellent", "premium"],
  fair: ["fair", "good", "excellent", "premium"],
  good: ["good", "excellent", "premium"],
  excellent: ["excellent", "premium"],
};

class BackMarketPlatform {
  constructor(platformConfig) {
    this.apiKey = platformConfig.apiKey || process.env.BACKMARKET_API_KEY || "";
    this.country = platformConfig.country || "us";
    this.name = "backmarket";
    this.rateLimitDelay = 2000;
  }

  async search(target) {
    if (!this.apiKey) {
      return this.getSimulatedListings(target);
    }

    return this.searchApi(target);
  }

  async searchApi(target) {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: "api.backmarket.com",
          path: `/products/search?q=${encodeURIComponent(target.model)}&price_max=${target.maxPrice}&category=desktops`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
            "Accept-Language": this.country === "us" ? "en-US" : "en-GB",
          },
          timeout: 15000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode !== 200) {
              console.warn(
                `[backmarket] API returned status ${res.statusCode}, using simulated data`
              );
              resolve(this.getSimulatedListings(target));
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const listings = (parsed.results || []).map((item) =>
                this.normalizeItem(item)
              );
              resolve(listings);
            } catch (err) {
              reject(
                new Error(`Failed to parse BackMarket response: ${err.message}`)
              );
            }
          });
        }
      );

      req.on("error", (err) => {
        console.warn(
          `[backmarket] API error: ${err.message}, using simulated data`
        );
        resolve(this.getSimulatedListings(target));
      });

      req.on("timeout", () => {
        req.destroy();
        console.warn("[backmarket] API timeout, using simulated data");
        resolve(this.getSimulatedListings(target));
      });

      req.end();
    });
  }

  normalizeItem(item) {
    return {
      id: `bm-${item.id || Date.now()}`,
      title: item.title || item.name || "",
      price: parseFloat(item.price || "0"),
      currency: item.currency || "USD",
      condition: item.grade || "good",
      url: item.url || item.public_url || "",
      platform: "backmarket",
      seller: item.merchant?.name || "BackMarket Certified",
      imageUrl: item.image?.url || "",
      listedAt: item.created_at || new Date().toISOString(),
    };
  }

  getSimulatedListings(target) {
    const basePrice = target.maxPrice;
    const modelName = target.model || "Mac Mini";
    const grades = CONDITION_GRADES[target.condition] || CONDITION_GRADES.any;

    const listings = [
      {
        id: `bm-sim-${Date.now()}-1`,
        title: `${modelName} 8GB 256GB - Certified Refurbished`,
        price: Math.round(basePrice * 0.9),
        currency: "USD",
        condition: grades[0],
        url: "https://www.backmarket.com/product/simulated-1",
        platform: "backmarket",
        seller: "BackMarket Certified",
        imageUrl: "",
        listedAt: new Date().toISOString(),
      },
      {
        id: `bm-sim-${Date.now()}-2`,
        title: `${modelName} 16GB 256GB - Premium Condition`,
        price: Math.round(basePrice * 1.05),
        currency: "USD",
        condition: "excellent",
        url: "https://www.backmarket.com/product/simulated-2",
        platform: "backmarket",
        seller: "RefurbTech Pro",
        imageUrl: "",
        listedAt: new Date().toISOString(),
      },
    ];

    return listings;
  }

  async purchase(listing, paymentConfig) {
    console.log(
      `[backmarket] Purchase requested for: ${listing.title} at $${listing.price}`
    );

    if (!this.apiKey) {
      return {
        success: false,
        simulated: true,
        message:
          "Simulated mode - no API key configured. In production, this would add to cart and checkout via BackMarket.",
        listing,
      };
    }

    return {
      success: false,
      message: "BackMarket API purchase requires merchant partner integration",
      listing,
    };
  }
}

module.exports = { BackMarketPlatform };
