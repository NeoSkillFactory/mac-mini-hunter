const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const DEFAULT_CONFIG = {
  targets: [
    {
      model: "Mac Mini M1",
      maxPrice: 400,
      condition: "good",
      platforms: ["ebay", "backmarket", "swappa"],
    },
  ],
  platforms: {
    ebay: { enabled: true, apiKey: "", marketplace: "EBAY_US" },
    backmarket: { enabled: true, apiKey: "", country: "us" },
    swappa: { enabled: true, apiKey: "" },
  },
  notifications: {
    console: true,
    webhook: { enabled: false, url: "" },
    logFile: { enabled: true, path: "./purchase-history.log" },
  },
  monitoring: {
    intervalSeconds: 300,
    maxPurchasesPerDay: 3,
    autoPurchase: false,
  },
  payment: {
    configured: false,
  },
};

function parseArgs(argv) {
  const args = {
    configPath: null,
    dryRun: false,
    once: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--config":
        args.configPath = argv[++i];
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--once":
        args.once = true;
        break;
    }
  }

  return args;
}

function loadConfig(configPath) {
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(__dirname, "..", "config.yaml");

  if (!fs.existsSync(resolvedPath)) {
    console.log(
      `[config] No config file found at ${resolvedPath}, using defaults`
    );
    return structuredClone(DEFAULT_CONFIG);
  }

  const raw = fs.readFileSync(resolvedPath, "utf-8");
  const parsed = YAML.parse(raw);

  return mergeConfig(DEFAULT_CONFIG, parsed);
}

function mergeConfig(defaults, overrides) {
  const result = structuredClone(defaults);

  if (!overrides) return result;

  if (overrides.targets && Array.isArray(overrides.targets)) {
    result.targets = overrides.targets.map((target) => ({
      model: target.model || "Mac Mini",
      maxPrice: Number(target.maxPrice) || 500,
      condition: target.condition || "any",
      platforms: target.platforms || ["ebay"],
    }));
  }

  if (overrides.platforms) {
    for (const [name, settings] of Object.entries(overrides.platforms)) {
      if (result.platforms[name]) {
        Object.assign(result.platforms[name], settings);
      } else {
        result.platforms[name] = settings;
      }
    }
  }

  if (overrides.notifications) {
    Object.assign(result.notifications, overrides.notifications);
  }

  if (overrides.monitoring) {
    Object.assign(result.monitoring, overrides.monitoring);
  }

  if (overrides.payment) {
    Object.assign(result.payment, overrides.payment);
  }

  return result;
}

function validateConfig(config) {
  const errors = [];

  if (!config.targets || config.targets.length === 0) {
    errors.push("At least one target must be defined");
  }

  for (const target of config.targets || []) {
    if (!target.model) {
      errors.push("Each target must have a model name");
    }
    if (typeof target.maxPrice !== "number" || target.maxPrice <= 0) {
      errors.push(`Invalid maxPrice for ${target.model}: ${target.maxPrice}`);
    }
    const validConditions = ["any", "fair", "good", "excellent"];
    if (!validConditions.includes(target.condition)) {
      errors.push(
        `Invalid condition for ${target.model}: ${target.condition}. Must be one of: ${validConditions.join(", ")}`
      );
    }
  }

  if (config.monitoring.intervalSeconds < 30) {
    errors.push("Monitoring interval must be at least 30 seconds");
  }

  if (config.monitoring.maxPurchasesPerDay < 0) {
    errors.push("maxPurchasesPerDay must be non-negative");
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { loadConfig, parseArgs, validateConfig, DEFAULT_CONFIG, mergeConfig };
