# ADR 0002: JWT Authentication and Role-Based Access Control (RBAC)

* **Status**: Accepted
* **Date**: 2026-07-24

## Context

MediTwin requires stateless, secure authentication for both frontend web clients and API integrations, along with strict Role-Based Access Control (RBAC) across three distinct user roles: Patient, Doctor, and Admin.

## Decision

We adopt **JSON Web Tokens (JWT)** via `djangorestframework-simplejwt` coupled with a custom `MongoJWTAuthentication` class:
* **Token Pair**: Short-lived Access Tokens (60 minutes) and rotated Refresh Tokens (7 days).
* **Role-Based Access Control**: Standardized `role` field (`patient`, `doctor`, `admin`) on the User model with property checks (`is_patient`, `is_doctor`, `is_admin_user`) enforced at API endpoints via DRF permissions.
* **ObjectId Compatibility**: `MongoJWTAuthentication` safely casts JWT user IDs to MongoDB `ObjectId` while maintaining string fallback support.

## Consequences

### Positive
* Stateless token authentication works across cross-origin web apps.
* Blacklisting rotated refresh tokens prevents token reuse attacks.
* Explicit RBAC prevents unauthorized patient data access between doctors and patients.

### Negative
* Client applications must store tokens securely (e.g. HttpOnly cookies or memory) and refresh access tokens before expiration.
