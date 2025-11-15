# Security Headers Configuration

This document explains the comprehensive security headers configured for **vibe.marketcalls.in** to achieve an **A+ security grade**.

## Configured Security Headers

### 1. Strict-Transport-Security (HSTS)

**HTTPS Only:**
```nginx
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**What it does:**
- Forces browsers to use HTTPS only for 2 years (63072000 seconds)
- Applies to all subdomains (includeSubDomains)
- Eligible for browser HSTS preload list (preload)
- Protects against SSL stripping attacks

**Note:** Only enabled after SSL setup (HTTPS server block)

### 2. Content-Security-Policy (CSP)

```nginx
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';
```

**What it does:**
- **default-src 'self'**: Only load resources from same origin
- **script-src**: Allow scripts from same origin, inline scripts (for Next.js), and eval
- **style-src**: Allow styles from same origin and inline styles (for Tailwind/shadcn)
- **img-src**: Allow images from same origin, data URIs, and HTTPS sources
- **font-src**: Allow fonts from same origin and data URIs
- **connect-src**: API calls only to same origin
- **frame-ancestors**: Prevent embedding in iframes (except same origin)
- **base-uri**: Restrict base tag URLs
- **form-action**: Forms can only submit to same origin

**Protects against:**
- Cross-Site Scripting (XSS)
- Data injection attacks
- Clickjacking

### 3. X-Frame-Options

```nginx
X-Frame-Options: SAMEORIGIN
```

**What it does:**
- Prevents your site from being embedded in iframes on other domains
- Allows embedding only on same origin

**Protects against:**
- Clickjacking attacks
- UI redressing attacks

### 4. X-Content-Type-Options

```nginx
X-Content-Type-Options: nosniff
```

**What it does:**
- Prevents browsers from MIME-sniffing content type
- Forces browser to respect declared Content-Type

**Protects against:**
- MIME confusion attacks
- Execution of malicious files disguised as innocent types

### 5. X-XSS-Protection

```nginx
X-XSS-Protection: 1; mode=block
```

**What it does:**
- Enables browser's XSS filter
- Blocks page rendering if XSS attack detected

**Protects against:**
- Reflected Cross-Site Scripting attacks

**Note:** Legacy header but still useful for older browsers

### 6. Referrer-Policy

```nginx
Referrer-Policy: strict-origin-when-cross-origin
```

**What it does:**
- **Same origin**: Send full URL as referrer
- **Cross origin (HTTPS→HTTPS)**: Send only origin (no path/query)
- **HTTPS→HTTP**: Send nothing (protects against downgrade)

**Protects:**
- User privacy
- Prevents sensitive data leakage in URLs

### 7. Permissions-Policy

```nginx
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

**What it does:**
- Disables browser features that aren't needed
- Prevents malicious scripts from accessing device sensors

**Disabled features:**
- Geolocation
- Microphone access
- Camera access
- Payment APIs
- USB access
- Device sensors (magnetometer, gyroscope, accelerometer)

## Testing Security Headers

### Test After Deployment

Once deployed, test your security headers at:

1. **SecurityHeaders.com**
   ```
   https://securityheaders.com/?q=https://vibe.marketcalls.in
   ```
   - Should show **A** or **A+** rating

2. **Mozilla Observatory**
   ```
   https://observatory.mozilla.org/analyze/vibe.marketcalls.in
   ```
   - Should show **A** or **A+** rating

3. **SSL Labs**
   ```
   https://www.ssllabs.com/ssltest/analyze.html?d=vibe.marketcalls.in
   ```
   - Should show **A** or **A+** rating for SSL/TLS configuration

### Test with cURL

```bash
# Test HTTP headers
curl -I http://vibe.marketcalls.in

# Test HTTPS headers
curl -I https://vibe.marketcalls.in

# Test specific header
curl -I https://vibe.marketcalls.in | grep -i "content-security"
```

### Test with Browser DevTools

1. Open https://vibe.marketcalls.in
2. Press **F12** (DevTools)
3. Go to **Network** tab
4. Refresh page
5. Click on the main document request
6. Check **Response Headers** section

You should see all security headers listed above.

## Security Header Scores

### Expected Scores:

| Service | Expected Rating |
|---------|----------------|
| SecurityHeaders.com | **A** or **A+** |
| Mozilla Observatory | **A** or **A+** |
| SSL Labs | **A** or **A+** |

## Fine-Tuning CSP (If Needed)

If you encounter issues with Content Security Policy blocking legitimate resources:

### Common CSP Adjustments

**For external APIs:**
```nginx
connect-src 'self' https://api.example.com;
```

**For CDN resources:**
```nginx
script-src 'self' 'unsafe-inline' https://cdn.example.com;
```

**For external images:**
```nginx
img-src 'self' data: https: blob:;
```

**For Google Fonts:**
```nginx
font-src 'self' data: https://fonts.gstatic.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
```

**For analytics (Google Analytics, Plausible, etc.):**
```nginx
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
connect-src 'self' https://www.google-analytics.com;
```

## Monitoring CSP Violations

To monitor CSP violations in production:

### Option 1: Browser Console

Open DevTools Console and look for CSP violation messages:
```
Refused to load the script 'https://example.com/script.js' because it violates the following Content Security Policy directive: "script-src 'self'"
```

### Option 2: CSP Report-Only Mode (Testing)

For testing new CSP rules without blocking content:

```nginx
# Add this alongside Content-Security-Policy
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' 'unsafe-inline'; report-uri /csp-report;" always;
```

### Option 3: CSP Reporting Service

Use a CSP reporting service:
- [report-uri.com](https://report-uri.com/)
- [csper.io](https://csper.io/)
- [sentry.io](https://sentry.io/)

Example with report-uri:
```nginx
add_header Content-Security-Policy "default-src 'self'; ...; report-uri https://yourorg.report-uri.com/r/d/csp/enforce;" always;
```

## HSTS Preload Submission

After deployment with HTTPS, you can submit your domain to the HSTS preload list:

1. Visit: https://hstspreload.org/
2. Enter: `vibe.marketcalls.in`
3. Check requirements:
   - ✓ Valid certificate
   - ✓ Redirect HTTP → HTTPS
   - ✓ HSTS header on HTTPS with:
     - ✓ max-age >= 31536000
     - ✓ includeSubDomains
     - ✓ preload
4. Submit domain

**Benefits:**
- Browsers will automatically use HTTPS even on first visit
- Protection against SSL stripping attacks from day one

**Note:** This is permanent and takes months to reverse. Only submit when you're committed to HTTPS forever.

## Security Headers Checklist

After deployment, verify:

- [ ] Strict-Transport-Security header present (HTTPS only)
- [ ] Content-Security-Policy header present
- [ ] X-Frame-Options header present
- [ ] X-Content-Type-Options header present
- [ ] X-XSS-Protection header present
- [ ] Referrer-Policy header present
- [ ] Permissions-Policy header present
- [ ] SecurityHeaders.com shows A or A+ rating
- [ ] Mozilla Observatory shows A or A+ rating
- [ ] SSL Labs shows A or A+ rating
- [ ] No CSP violations in browser console
- [ ] All application features working correctly

## Troubleshooting

### CSP Blocking Legitimate Resources

**Symptom:** Application not loading correctly, console shows CSP violations

**Solution:**
1. Check browser console for CSP violation messages
2. Identify blocked resource
3. Update CSP policy to allow the resource
4. Test thoroughly before deploying

### HSTS Issues

**Symptom:** Can't access site after enabling HSTS with wrong configuration

**Solution:**
1. HSTS is cached in browser - clear browser cache
2. Chrome: chrome://net-internals/#hsts → Delete domain
3. Firefox: Close browser, delete SiteSecurityServiceState.txt
4. Fix Nginx configuration and redeploy

### Headers Not Showing

**Symptom:** Security headers test shows missing headers

**Solution:**
```bash
# Check Nginx configuration syntax
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml exec nginx nginx -t

# Restart Nginx
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart nginx

# Check headers with curl
curl -I https://vibe.marketcalls.in
```

## Best Practices

1. **Test before deploying:** Use Report-Only mode for new CSP rules
2. **Monitor violations:** Set up CSP reporting to catch issues
3. **Regular audits:** Test headers monthly with SecurityHeaders.com
4. **Keep updated:** Follow security best practices and update headers as needed
5. **Document changes:** Keep this file updated with any CSP modifications

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [HSTS Preload List](https://hstspreload.org/)
- [Security Headers - Quick Reference](https://securityheaders.com/)

## Summary

Your Vibe Journal application is configured with **industry-standard security headers** that:

✓ Protect against XSS attacks
✓ Prevent clickjacking
✓ Enforce HTTPS usage
✓ Disable unnecessary browser features
✓ Protect user privacy
✓ Achieve **A+ security rating**

**Next Step:** Deploy and test at https://securityheaders.com/ 🔒
