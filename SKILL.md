---
name: mac-mini-hunter
description: Automatically monitor Mac Mini availability on secondary markets and purchase when prices drop below specified thresholds.
version: 1.0.0
author: openclaw
tags:
  - hardware
  - monitoring
  - purchasing
  - mac-mini
  - automation
---

# mac-mini-hunter

Automatically monitor Mac Mini availability on secondary markets and purchase when prices drop below specified thresholds to help users acquire hardware for OpenClaw deployments.

## Core Capabilities

- **Multi-platform monitoring**: Track Mac Mini listings on eBay, BackMarket, and Swappa simultaneously
- **Price threshold alerts**: Configure model-specific price targets and get notified when deals appear
- **Automated purchasing**: Execute purchases automatically when listings match your criteria
- **Notification system**: Receive alerts via console, webhook, or log file when deals are found
- **Configuration management**: CLI-driven configuration with YAML-based persistence
- **Purchase history**: Track all transactions with timestamps, prices, and platform details

## Out of Scope

- Physical hardware handling (shipping, receiving, testing)
- Payment method setup and management (assumes pre-configured)
- Account creation on marketplace platforms
- Cross-border shipping or customs handling
- Hardware setup or configuration after purchase

## Trigger Scenarios

- "Monitor eBay for M1 Mac Minis under $400 and buy the first one you find"
- "Set up price alerts for used Mac Mini models and notify me when they drop below $500"
- "Automatically purchase a 2020 Intel Mac Mini if it appears on BackMarket for under $300"
- "I need to expand my OpenClaw cluster, find me used Mac Minis at reasonable prices"

## Usage

### CLI

```bash
# Start monitoring with default config
node scripts/monitor.js

# Start monitoring with custom config
node scripts/monitor.js --config ./my-config.yaml

# Run in dry-run mode (no purchases)
node scripts/monitor.js --dry-run

# Single scan (no continuous monitoring)
node scripts/monitor.js --once
```

### Configuration

Copy `config.example.yaml` to `config.yaml` and edit to set your preferences:

```yaml
targets:
  - model: "Mac Mini M1"
    maxPrice: 400
    condition: "good"
    platforms: ["ebay", "backmarket"]
```

## Required Resources

- `scripts/`: Main implementation files
- `references/`: API documentation and rate limiting guides
- `assets/`: Platform selectors and checkout flow data

## Key Files

| File | Purpose |
|------|---------|
| `scripts/monitor.js` | Core monitoring and price tracking |
| `scripts/purchase.js` | Automated purchase execution |
| `scripts/config.js` | Configuration management |
| `scripts/notifications.js` | Alert and notification system |
| `scripts/platforms/ebay.js` | eBay integration |
| `scripts/platforms/backmarket.js` | BackMarket integration |
| `scripts/platforms/swappa.js` | Swappa integration |
