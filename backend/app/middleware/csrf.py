from fastapi import Request, HTTPException, status
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from itsdangerous import URLSafeTimedSerializer, BadSignature
import os
from typing import Optional

# CSRF configuration from environment variables
CSRF_SECRET = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
CSRF_TOKEN_EXPIRE_SECONDS = int(os.getenv("CSRF_TOKEN_EXPIRE_SECONDS", "3600"))
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "true").lower() == "true"
CSRF_COOKIE_SAMESITE = os.getenv("CSRF_COOKIE_SAMESITE", "lax")

CSRF_TOKEN_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"

# Methods that require CSRF protection
CSRF_PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Paths exempt from CSRF protection
CSRF_EXEMPT_PATHS = {
    "/api/auth/login",
    "/api/auth/register",
    "/docs",
    "/openapi.json",
    "/health",
    "/"
}

serializer = URLSafeTimedSerializer(CSRF_SECRET)


def generate_csrf_token() -> str:
    """Generate a new CSRF token"""
    import secrets
    token_data = secrets.token_urlsafe(32)
    return serializer.dumps(token_data)


def validate_csrf_token(token: str) -> bool:
    """
    Validate CSRF token

    Args:
        token: The CSRF token to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        serializer.loads(token, max_age=CSRF_TOKEN_EXPIRE_SECONDS)
        return True
    except (BadSignature, Exception):
        return False


class CSRFProtectMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection Middleware

    Implements Double Submit Cookie pattern:
    1. Generates CSRF token and sets it in a cookie
    2. Validates CSRF token from header against cookie for state-changing requests
    """

    async def dispatch(self, request: Request, call_next):
        # Check if path is exempt from CSRF protection
        if self._is_exempt_path(request.url.path):
            response = await call_next(request)
            # Set CSRF token cookie for exempt paths too (for subsequent requests)
            if request.method == "POST" and request.url.path in ["/api/auth/login", "/api/auth/register"]:
                csrf_token = generate_csrf_token()
                response.set_cookie(
                    key=CSRF_COOKIE_NAME,
                    value=csrf_token,
                    httponly=True,
                    secure=CSRF_COOKIE_SECURE,
                    samesite=CSRF_COOKIE_SAMESITE,
                    max_age=CSRF_TOKEN_EXPIRE_SECONDS
                )
                # Also send in response header for client to read
                response.headers[CSRF_HEADER_NAME] = csrf_token
            return response

        # For CSRF-protected methods, validate token
        if request.method in CSRF_PROTECTED_METHODS:
            # Get CSRF token from header
            csrf_header_token = request.headers.get(CSRF_HEADER_NAME)

            # Get CSRF token from cookie
            csrf_cookie_token = request.cookies.get(CSRF_COOKIE_NAME)

            # Validate tokens
            if not csrf_header_token or not csrf_cookie_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token missing"
                )

            # Tokens must match
            if csrf_header_token != csrf_cookie_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token mismatch"
                )

            # Validate token signature and age
            if not validate_csrf_token(csrf_header_token):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token invalid or expired"
                )

        # Process request
        response = await call_next(request)

        # Refresh CSRF token in cookie for all successful requests
        if response.status_code < 400:
            csrf_token = generate_csrf_token()
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=csrf_token,
                httponly=True,
                secure=CSRF_COOKIE_SECURE,
                samesite=CSRF_COOKIE_SAMESITE,
                max_age=CSRF_TOKEN_EXPIRE_SECONDS
            )
            # Send in response header for client to read
            response.headers[CSRF_HEADER_NAME] = csrf_token

        return response

    def _is_exempt_path(self, path: str) -> bool:
        """Check if path is exempt from CSRF protection"""
        # Exact match
        if path in CSRF_EXEMPT_PATHS:
            return True

        # Prefix match for documentation and static paths
        exempt_prefixes = ("/docs", "/redoc", "/openapi", "/static")
        if any(path.startswith(prefix) for prefix in exempt_prefixes):
            return True

        # GET requests are exempt (CSRF protects state-changing operations)
        return False
