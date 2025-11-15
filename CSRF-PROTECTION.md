# CSRF Protection Implementation

## Overview

Cross-Site Request Forgery (CSRF) protection has been implemented to prevent unauthorized commands from being transmitted from a user that the web application trusts.

## How It Works

### Double Submit Cookie Pattern

The application uses the **Double Submit Cookie pattern** for CSRF protection:

1. **Backend generates CSRF token**: A cryptographically secure token is generated and signed
2. **Token sent in two places**:
   - As an HTTP-only cookie (`csrf_token`)
   - As a response header (`X-CSRF-Token`)
3. **Frontend stores token**: The token from the header is stored in memory
4. **Frontend sends token**: For state-changing requests (POST, PUT, PATCH, DELETE), the token is sent in the `X-CSRF-Token` header
5. **Backend validates**: The backend compares the token from the header with the token from the cookie

## Architecture

### Backend (FastAPI)

**Files**:
- `backend/app/middleware/csrf.py` - CSRF middleware implementation
- `backend/app/main.py` - Middleware registration

**Key Features**:
- Custom middleware using `itsdangerous` for token signing
- Token expires after 1 hour (configurable)
- Automatic token refresh on successful requests
- Exempt paths (login, register, docs)
- Protected methods: POST, PUT, PATCH, DELETE

**Configuration**:
```python
CSRF_SECRET = os.getenv("SECRET_KEY")  # Uses same secret as JWT
CSRF_TOKEN_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"
CSRF_PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
```

**Exempt Paths**:
- `/api/auth/login` - Users need to login to get token
- `/api/auth/register` - Users need to register to get token
- `/docs` - API documentation
- `/openapi.json` - API schema
- `/health` - Health check endpoint

### Frontend (Next.js)

**Files**:
- `frontend/lib/api.ts` - Axios client with CSRF handling

**Key Features**:
- Axios configured with `withCredentials: true` to send cookies
- Request interceptor adds `X-CSRF-Token` header for state-changing requests
- Response interceptor extracts and stores CSRF token from headers
- Automatic token refresh with each request

**Flow**:
```
1. User logs in → Backend sends CSRF token in header & cookie
2. Frontend stores token from header
3. User creates portfolio (POST) → Frontend sends token in X-CSRF-Token header
4. Backend validates: header token === cookie token
5. If valid → Process request + send new token
6. If invalid → Return 403 Forbidden
```

## Security Properties

### What CSRF Protection Prevents

✅ **Prevents**: Unauthorized actions from malicious websites
- Attacker cannot create portfolios, trades, or modify data
- Attacker cannot delete user data
- Attacker cannot change user settings

### What CSRF Protection Does NOT Prevent

❌ **Does not prevent**:
- XSS attacks (use CSP headers for this)
- Man-in-the-middle attacks (use HTTPS)
- Credential theft (use strong passwords + 2FA)

## Additional Security Layers

The CSRF protection works alongside other security measures:

1. **JWT Authentication**: Verifies user identity
2. **HTTPS/SSL**: Encrypts data in transit
3. **Security Headers**:
   - HSTS (forces HTTPS)
   - CSP (prevents XSS)
   - X-Frame-Options (prevents clickjacking)
4. **Cookie Security**:
   - `HttpOnly`: Prevents JavaScript access
   - `Secure`: Only sent over HTTPS
   - `SameSite=Lax`: Prevents cross-site cookie sending

## Token Lifecycle

```
┌─────────────────────────────────────────────────┐
│ User Login/Register                              │
│ ↓                                                │
│ Backend generates CSRF token                     │
│ ↓                                                │
│ Token sent in:                                   │
│   - Cookie (HTTP-only, Secure, SameSite=Lax)    │
│   - Response header (X-CSRF-Token)               │
│ ↓                                                │
│ Frontend stores token from header                │
│ ↓                                                │
│ User performs action (POST/PUT/PATCH/DELETE)     │
│ ↓                                                │
│ Frontend sends token in request header           │
│ ↓                                                │
│ Backend validates:                               │
│   - Header token present?                        │
│   - Cookie token present?                        │
│   - Header token === Cookie token?               │
│   - Token signature valid?                       │
│   - Token not expired?                           │
│ ↓                                                │
│ If valid → Process request + send new token      │
│ If invalid → Return 403 Forbidden                │
│ ↓                                                │
│ Token auto-refreshes with each successful request│
└─────────────────────────────────────────────────┘
```

## Testing CSRF Protection

### Test 1: Valid Request

```bash
# Should succeed with valid CSRF token
curl -X POST https://vibe.marketcalls.in/api/portfolios \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -H "Cookie: csrf_token=YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Portfolio","initial_balance":100000}'
```

### Test 2: Missing CSRF Token

```bash
# Should fail with 403 Forbidden
curl -X POST https://vibe.marketcalls.in/api/portfolios \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Portfolio","initial_balance":100000}'

# Response: {"detail":"CSRF token missing"}
```

### Test 3: Mismatched CSRF Token

```bash
# Should fail with 403 Forbidden
curl -X POST https://vibe.marketcalls.in/api/portfolios \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-CSRF-Token: WRONG_TOKEN" \
  -H "Cookie: csrf_token=DIFFERENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Portfolio","initial_balance":100000}'

# Response: {"detail":"CSRF token mismatch"}
```

### Test 4: Exempt Path (Login)

```bash
# Should succeed without CSRF token
curl -X POST https://vibe.marketcalls.in/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=youruser&password=yourpass"

# Response includes X-CSRF-Token header for subsequent requests
```

## Browser Testing

1. **Normal Flow**:
   - Login → Check DevTools Network → Response Headers should have `X-CSRF-Token`
   - Create Portfolio → Check Request Headers should have `X-CSRF-Token`
   - Should succeed ✅

2. **CSRF Attack Simulation**:
   - Open browser console
   - Try to make request without CSRF token:
     ```javascript
     fetch('https://vibe.marketcalls.in/api/portfolios', {
       method: 'POST',
       headers: {
         'Authorization': 'Bearer YOUR_TOKEN',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({name: 'Test', initial_balance: 100000})
     })
     ```
   - Should fail with 403 Forbidden ❌

## Configuration

### Adjusting Token Expiry

In `backend/app/middleware/csrf.py`:

```python
# Default: 1 hour
CSRF_TOKEN_MAX_AGE = 3600

# Change to 30 minutes:
CSRF_TOKEN_MAX_AGE = 1800

# Change to 4 hours:
CSRF_TOKEN_MAX_AGE = 14400
```

### Adding Exempt Paths

In `backend/app/middleware/csrf.py`:

```python
CSRF_EXEMPT_PATHS = {
    "/api/auth/login",
    "/api/auth/register",
    "/docs",
    "/openapi.json",
    "/health",
    "/",
    # Add new exempt paths here
    "/api/public/endpoint",
}
```

### Adjusting Cookie Settings

In `backend/app/middleware/csrf.py`:

```python
response.set_cookie(
    key=CSRF_COOKIE_NAME,
    value=csrf_token,
    httponly=True,        # Cannot be accessed by JavaScript
    secure=True,          # Only sent over HTTPS (set to False for local dev)
    samesite="lax",       # or "strict" for more security
    max_age=3600,         # 1 hour
    domain=None,          # or ".yourdomain.com" for subdomains
)
```

## Troubleshooting

### Issue: "CSRF token missing" on all requests

**Solution**: Check if:
1. Frontend has `withCredentials: true` in axios config
2. CORS is configured to expose `X-CSRF-Token` header
3. Login/register is working and returning token

### Issue: "CSRF token mismatch"

**Solution**: Check if:
1. Frontend is storing token from response header correctly
2. Frontend is sending token in request header for POST/PUT/PATCH/DELETE
3. Cookies are enabled in browser

### Issue: Token expires too quickly

**Solution**: Increase `max_age` in token validation and cookie settings

### Issue: CSRF errors on mobile/different devices

**Solution**: Check if:
1. HTTPS is enabled (required for `Secure` cookies)
2. Domain in cookie settings allows cross-subdomain access if needed
3. SameSite attribute is appropriate for your setup

## Monitoring

### Backend Logs

CSRF errors will appear in logs:
```
INFO: "POST /api/portfolios HTTP/1.1" 403 Forbidden
```

### Frontend Console

CSRF errors will log:
```javascript
CSRF protection error: CSRF token missing
CSRF protection error: CSRF token mismatch
```

## Best Practices

1. ✅ **Always use HTTPS in production** - CSRF cookies require `Secure` attribute
2. ✅ **Keep tokens short-lived** - 1 hour is reasonable, auto-refresh handles renewal
3. ✅ **Use SameSite cookies** - Prevents cross-site request attacks
4. ✅ **Combine with other security** - CSRF + JWT + HTTPS + CSP = defense in depth
5. ✅ **Test thoroughly** - Verify CSRF protection doesn't break legitimate requests
6. ✅ **Monitor errors** - Log and alert on CSRF failures

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

## Summary

Your Vibe Journal application now has **enterprise-grade CSRF protection** that:

✅ Prevents unauthorized actions from malicious websites
✅ Works seamlessly with JWT authentication
✅ Auto-refreshes tokens for convenience
✅ Exempts authentication endpoints logically
✅ Provides clear error messages for debugging
✅ Follows OWASP security best practices

**Your application is now protected against CSRF attacks!** 🔒
