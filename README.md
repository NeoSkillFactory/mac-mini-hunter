# mac-mini-hunter

![Audit](https://img.shields.io/badge/audit%3A%20PASS-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![OpenClaw](https://img.shields.io/badge/OpenClaw-skill-orange)

> Automatically monitor Mac Mini availability on secondary markets and purchase when prices drop below specified thresholds.

## Features

- **Multi-platform monitoring**: Track Mac Mini listings on eBay, BackMarket, and Swappa simultaneously
- **Price threshold alerts**: Configure model-specific price targets and get notified when deals appear
- **Automated purchasing**: Execute purchases automatically when listings match your criteria
- **Notification system**: Receive alerts via console, webhook, or log file when deals are found
- **Configuration management**: CLI-driven configuration with YAML-based persistence
- **Purchase history**: Track all transactions with timestamps, prices, and platform details

## Configuration

Copy `config.example.yaml` to `config.yaml` and edit to set your preferences:

```yaml
targets:
  - model: "Mac Mini M1"
    maxPrice: 400
    condition: "good"
    platforms: ["ebay", "backmarket"]
```

## GitHub

Source code: [github.com/NeoSkillFactory/mac-mini-hunter](https://github.com/NeoSkillFactory/mac-mini-hunter)

**Price suggestion:** $29 USD

## License

MIT © NeoSkillFactory
