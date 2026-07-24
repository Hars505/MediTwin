# ADR 0001: Hybrid Database Architecture (Django ORM + MongoDB)

* **Status**: Accepted
* **Date**: 2026-07-24

## Context

MediTwin handles two distinct types of data:
1. Structured user accounts, authentication credentials, roles, and relational associations requiring ACID compliance.
2. Dynamic, high-frequency health vitals snapshots, risk score histories, lifestyle logs, chatbot conversation sessions, and audit event logs requiring flexible schemas and quick document storage.

## Decision

We adopt a **Hybrid Database Architecture**:
* **Django MongoDB Backend (`django_mongodb_backend`)**: Handles user authentication models (`accounts.User`) and core relational tables stored in MongoDB.
* **Direct PyMongo Collections (`mongo_models.py`)**: Stores dynamic, document-based health records (`health_profiles`, `vitals_history`, `risk_scores`, `chatbot_sessions`, `audit_logs`).

## Consequences

### Positive
* High performance for continuous vitals logging and unstructured AI session storage.
* Schema flexibility for evolving medical risk factors without database migration overhead.
* Built-in audit logging and fast timeline queries.

### Negative
* Requires careful index management in MongoDB for querying history by `user_id` and timestamps.
* Developers must use defined `mongo_models.py` wrappers to maintain consistency.
