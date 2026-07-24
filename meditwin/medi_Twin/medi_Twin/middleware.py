"""
Security Headers Middleware for Django (Helmet.js equivalent).
Applies HTTP security headers to all responses to protect against common web vulnerabilities.
"""
from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Middleware that adds key security headers to every HTTP response.
    Equivalent to Helmet.js protection for Node/Express.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Prevent MIME-type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'

        # Protect against clickjacking
        response.headers['X-Frame-Options'] = 'DENY'

        # Enable XSS filtering in browsers
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # Referrer Policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Content Security Policy (CSP)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self' ws: wss: http: https:; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "frame-ancestors 'none';"
        )
        response.headers['Content-Security-Policy'] = csp

        # Permissions Policy (restrict sensitive web APIs)
        permissions_policy = (
            "camera=(), "
            "microphone=(), "
            "geolocation=(), "
            "payment=(), "
            "usb=()"
        )
        response.headers['Permissions-Policy'] = permissions_policy

        # Cross-Origin Isolation & Resource Sharing Headers
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'

        return response
