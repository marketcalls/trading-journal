# Rate Limiting Configuration

This document describes the rate limiting implementation in the Vibe Journal application to protect against abuse, DDoS attacks, and ensure fair resource usage.

## Overview

The application uses **Nginx's `limit_req` module** to implement multi-tier rate limiting based on client IP addresses (`$binary_remote_addr`).

## Rate Limiting Tiers

### 1. General API Endpoints (`/api/*`)

Three-tier rate limiting is applied to all general API endpoints:

| Tier | Limit | Burst | Purpose |
|------|-------|-------|---------|
| **Per Second** | 50 requests/second | 50 | Prevent rapid-fire attacks |
| **Per Hour** | ~500 requests/hour | 500 | Limit sustained usage per hour |
| **Per Day** | ~10,000 requests/day | 10,000 | Daily quota enforcement |

**Configuration:**
```nginx
location /api/ {
    limit_req zone=per_second burst=50 nodelay;
    limit_req zone=per_hour burst=500 nodelay;
    limit_req zone=per_day burst=10000 nodelay;
    limit_req_status 429;
    # ... proxy settings ...
}
```

### 2. Authentication Endpoints (`/api/auth/login`, `/api/auth/register`)

Stricter rate limiting for authentication to prevent brute-force attacks:

| Limit | Burst | Purpose |
|-------|-------|---------|
| 5 requests/minute | 10 | Prevent credential stuffing and brute force |

**Configuration:**
```nginx
location ~ ^/api/auth/(login|register) {
    limit_req zone=login_limit burst=10 nodelay;
    limit_req_status 429;
    # ... proxy settings ...
}
```

## Rate Limiting Zones

Defined in the `http` block of `nginx.conf`:

```nginx
# Per-second limit: 50 requests per second
limit_req_zone $binary_remote_addr zone=per_second:10m rate=50r/s;

# Per-hour limit: ~500 requests per hour (8 r/m = 480/hour with burst allowance)
limit_req_zone $binary_remote_addr zone=per_hour:10m rate=8r/m;

# Per-day limit: ~10,000 requests per day (7 r/m = 10,080/day)
limit_req_zone $binary_remote_addr zone=per_day:10m rate=7r/m;

# Login limit: 5 requests per minute for authentication
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
```

## How It Works

### Leaky Bucket Algorithm

Nginx uses a **leaky bucket algorithm** for rate limiting:

1. **Rate**: The steady-state rate at which requests are allowed (e.g., 50r/s)
2. **Burst**: The maximum number of requests that can exceed the rate temporarily
3. **nodelay**: Process requests immediately when under the burst limit

### Example Scenarios

#### Scenario 1: Normal Usage
- User makes 10 requests per second consistently
- ✅ All requests pass all tiers (well under limits)

#### Scenario 2: Burst Activity
- User makes 45 requests in 1 second
- ✅ Passes per-second limit (50/s with burst=50)
- ✅ Passes per-hour limit (well under 500/hour)
- ✅ Passes per-day limit (well under 10,000/day)

#### Scenario 3: Sustained High Usage
- User makes 30 requests/second for 20 seconds = 600 requests
- ✅ Passes per-second check (bursts allowed)
- ❌ **Hits per-hour limit** (~500 requests/hour)
- Returns HTTP 429 (Too Many Requests)

#### Scenario 4: Brute Force Login Attempt
- Attacker tries 20 login requests in 1 minute
- ✅ Passes general rate limits
- ❌ **Hits login limit** (5/minute with burst=10)
- Returns HTTP 429 after 10th request

## HTTP Status Codes

| Code | Description | Meaning |
|------|-------------|---------|
| **200-299** | Success | Request processed normally |
| **429** | Too Many Requests | Rate limit exceeded |
| **503** | Service Unavailable | Server overloaded (general) |

## Client-Side Handling

When a request is rate-limited (HTTP 429), clients should:

1. **Respect the limit** - Stop sending requests temporarily
2. **Implement exponential backoff** - Wait before retrying
3. **Show user-friendly message** - "Too many requests, please try again later"

### Example Client Code (JavaScript/TypeScript)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://vibe.marketcalls.in/api',
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      // Rate limited - implement exponential backoff
      const retryAfter = error.response.headers['retry-after'] || 5;
      console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);

      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

      // Optionally retry the request
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Monitoring and Logs

### Nginx Access Logs

Rate-limited requests appear in access logs:

```
192.168.1.100 - - [15/Nov/2025:10:30:45 +0000] "POST /api/trades HTTP/1.1" 429 185
```

### Nginx Error Logs

```
[error] 1234#1234: *56789 limiting requests, excess: 50.123 by zone "per_hour",
client: 192.168.1.100, server: vibe.marketcalls.in
```

### Check Rate Limit Status

```bash
# View recent 429 errors
docker-compose -f docker-compose.prod.yml logs nginx | grep " 429 "

# Count rate limit errors in last hour
docker-compose -f docker-compose.prod.yml logs --since 1h nginx | grep " 429 " | wc -l
```

## Adjusting Rate Limits

### Increase Limits

To increase limits, edit `nginx/nginx.conf`:

```nginx
# Example: Increase to 100/second
limit_req_zone $binary_remote_addr zone=per_second:10m rate=100r/s;

# Example: Increase to 1000/hour (16r/m)
limit_req_zone $binary_remote_addr zone=per_hour:10m rate=16r/m;
```

Then reload Nginx:

```bash
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Whitelist Specific IPs

To exempt specific IPs from rate limiting, use geo module:

```nginx
geo $limit {
    default 1;
    192.168.1.100 0;  # Internal office IP
    10.0.0.0/8 0;     # Internal network
}

map $limit $limit_key {
    0 "";
    1 $binary_remote_addr;
}

limit_req_zone $limit_key zone=per_second:10m rate=50r/s;
```

## Production Recommendations

1. **Monitor regularly** - Check logs for unusual 429 patterns
2. **Adjust as needed** - Tune limits based on legitimate usage patterns
3. **Set up alerts** - Alert on high rate limit violation rates
4. **Consider CDN** - Use Cloudflare or similar for additional DDoS protection
5. **Document limits** - Inform API consumers about rate limits

## Security Benefits

✅ **DDoS Protection** - Prevents distributed denial-of-service attacks
✅ **Brute Force Prevention** - Limits login/register attempts
✅ **Resource Protection** - Ensures fair usage across all users
✅ **Cost Control** - Prevents excessive resource consumption
✅ **Service Stability** - Maintains availability during traffic spikes

## Troubleshooting

### Issue: Legitimate users getting rate-limited

**Solution:**
- Review access logs to identify usage patterns
- Increase limits if usage is legitimate
- Consider whitelisting specific IPs
- Implement user-based rate limiting (requires application-level changes)

### Issue: Rate limits not working

**Solution:**
```bash
# Check Nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload Nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

# Check if zones are created
docker-compose -f docker-compose.prod.yml exec nginx cat /proc/meminfo | grep -i shared
```

### Issue: Need per-user rate limiting instead of per-IP

**Solution:**
- Requires application-level rate limiting (e.g., using Redis)
- Consider implementing in FastAPI with `slowapi` or similar libraries
- Use JWT token claims as the rate limit key

## References

- [Nginx Rate Limiting Documentation](http://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- [Nginx Rate Limiting Best Practices](https://www.nginx.com/blog/rate-limiting-nginx/)
- [OWASP Rate Limiting Guidance](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

**Last Updated:** November 15, 2025
**Nginx Version:** nginx/1.25 (Alpine)
**Module:** ngx_http_limit_req_module
