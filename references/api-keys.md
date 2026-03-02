# API Key Management

## Supported Environment Variables

| Variable | Platform | Description |
|----------|----------|-------------|
| `EBAY_API_KEY` | eBay | Browse API OAuth token |
| `BACKMARKET_API_KEY` | BackMarket | Partner API key |
| `SWAPPA_API_KEY` | Swappa | Developer API key |
| `MAC_HUNTER_PAYMENT_TOKEN` | Payment | Payment processing token |

## Configuration Priority

1. Environment variables (highest priority)
2. `config.yaml` values
3. Default values (empty - simulated mode)

## Security Best Practices

- Never commit API keys to version control
- Use environment variables or a secrets manager
- Rotate keys regularly
- Use read-only API keys where possible (monitoring)
- Separate keys for monitoring vs purchasing operations

## Obtaining API Keys

### eBay Browse API
1. Register at https://developer.ebay.com
2. Create an application
3. Generate an OAuth token with `buy.browse` scope
4. For purchasing, additionally request `buy.order` scope

### BackMarket
1. Apply for partner API access at https://www.backmarket.com/partners
2. API keys are issued after approval

### Swappa
1. Contact Swappa developer relations
2. API access is limited to approved partners
