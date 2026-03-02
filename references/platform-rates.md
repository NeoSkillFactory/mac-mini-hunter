# Platform Rate Limits

## eBay Browse API

| Limit | Value |
|-------|-------|
| Requests per second | 5 |
| Daily limit | 5,000 |
| Burst | 10 requests |
| Recommended delay | 1,000ms between requests |

Notes:
- Rate limits vary by API key tier
- 429 responses include `Retry-After` header
- Excessive 429s may result in temporary ban

## BackMarket API

| Limit | Value |
|-------|-------|
| Requests per second | 2 |
| Daily limit | 1,000 |
| Burst | 5 requests |
| Recommended delay | 2,000ms between requests |

Notes:
- Partner tier determines limits
- Contact BackMarket for limit increases

## Swappa API

| Limit | Value |
|-------|-------|
| Requests per second | 3 |
| Daily limit | 2,000 |
| Burst | 5 requests |
| Recommended delay | 1,500ms between requests |

Notes:
- Limits are per API key
- Rate limit info included in response headers

## General Strategy

- Space requests according to platform-specific delays
- Implement exponential backoff on 429/503 responses
- Cache results to minimize redundant API calls
- Monitor daily usage to stay within limits
