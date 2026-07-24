# MediTwin Coding Standards & Guidelines

This document outlines the coding standards, patterns, and quality practices for the MediTwin codebase. All contributors must adhere to these guidelines.

---

## 1. Python & Django Standards

### 1.1 Style Guide (PEP 8)
- Follow **PEP 8** style conventions.
- Line length limit: **100 characters**.
- Use **4 spaces** per indentation level.
- Variable and function names should use `snake_case`.
- Class names must use `PascalCase`.
- Constants must use `UPPER_SNAKE_CASE`.

### 1.2 Docstrings & Comments
- All public modules, classes, methods, and functions must have Google-style docstrings.
- Docstrings must specify parameters, return types, and exceptions raised.
```python
def calculate_risk_scores(profile: dict, vitals: dict) -> dict:
    """Calculate multi-condition disease risk scores from patient data.

    Args:
        profile (dict): Patient health profile containing age, gender, medical history.
        vitals (dict): Patient latest vitals containing blood pressure, heart rate, BMI.

    Returns:
        dict: Calculated risk percentages and cascade risk markers.
    """
```

### 1.3 Django & DRF Architecture
- **Views**: Use Django REST Framework `APIView` or generic views with explicit `permission_classes` and `throttle_classes`.
- **Serializers**: Enforce strict field validation in DRF serializers; never rely solely on front-end validation.
- **MongoDB Integration**: Access MongoDB through helper methods in `mongo_models.py` modules within each app to isolate data access logic.
- **Error Handling**: Return standard DRF `Response` objects with appropriate HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`).

---

## 2. JavaScript & React (Frontend) Standards

### 2.1 Code Formatting
- Follow **ESLint** and **Prettier** rules.
- Line length limit: **100 characters**.
- Use **2 spaces** per indentation level.
- Use single quotes `'` for string literals in JS/JSX.
- Component names must use `PascalCase` matching their filenames (`HealthDashboard.jsx`).

### 2.2 React Best Practices
- Use functional components with React Hooks.
- Custom logic should be encapsulated in reusable custom hooks in `src/hooks/`.
- Prop types or TS interfaces should be defined where applicable.
- Keep UI components clean and delegate API calls to `src/lib/api.js`.

---

## 3. Security Standards

- **Passwords**: Never log, display, or return user passwords. Always use `make_password()` or `set_password()`.
- **Input Sanitization**: Strip and validate strings before saving or querying databases.
- **Path Traversal Defense**: Validate file paths using regex or `Path.relative_to` before opening files.
- **Throttling**: Apply rate limits to all authentication and high-cost AI/ML endpoints.

---

## 4. Git & Version Control

- **Commit Messages**: Use concise imperative summary messages (e.g., `feat: add risk score trend endpoint`, `fix: sanitize report download path`).
- **Pre-commit**: Run pre-commit checks before pushing changes to ensure code style and linting pass clean.
