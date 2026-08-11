# Testing & Verification Specification — Acing IU

This document details the testing strategies and verification benchmarks applied to secure the **Acing IU** platform against regressions, unauthorized state mutations, and component drift.

---

## 1. Test Architecture

Testing is split into four progressive validation barriers:

```text
+-------------------+      +-------------------+      +-------------------+      +-------------------+
|    Unit Tests     | ---> | Integration Tests | ---> |    Smoke Tests    | ---> | Visual Regression |
|   (Local JVM)     |      |  (Service Level)  |      |  (Health Checks)  |      |   (Roborazzi)     |
+-------------------+      +-------------------+      +-------------------+      +-------------------+
```

---

## 2. Unit Testing Rules

### 2.1 Backend Services (.NET Unit Testing)
*   All business rule models (e.g. Device Trust calculator, Policy Engine matcher, JWT generator) must carry dedicated unit tests written in xUnit.
*   **Coverage Target**: Minimum of 80% coverage for business controllers, services, and domain entities.
*   **Sample Test Scenario**:
    *   *GIVEN* a device is running an outdated operating system (e.g., iOS 13).
    *   *WHEN* the Trust Engine evaluates compliance.
    *   *THEN* the calculated Device Trust Score must fall below the standard Trusted threshold (< 70).

### 2.2 Frontend Components (Next.js Unit Testing)
*   Utility libraries, state handlers, and security authorization context states are validated using Jest and React Testing Library.
*   Interactive forms (Registration, Login, MFA verification code entry) must verify visual and logic feedback (e.g., showing input validation error states).

---

## 3. Local JVM Testing (Android/Kotlin Reference)

For Jetpack Compose elements and ViewModel state triggers within companion tools or Android management consoles, we maintain lightweight, fast JVM unit tests:

*   **Framework**: Robolectric is used to mock Android SDK structures (e.g., SQLite databases, context states, resources) directly on the local JVM.
*   **Verification Commands**:
    ```bash
    # Run JVM unit tests
    gradle :app:testDebugUnitTest
    ```

### 3.4 Screenshot Testing (Roborazzi Verification)
To prevent style drift or broken layouts on critical security views (e.g., Active Threats Feed or Device Policy Manager):
*   Use Roborazzi to capture reference screenshots on standard configurations.
*   **Visual Regression Commands**:
    ```bash
    # Verify visual differences
    gradle :app:verifyRoborazziDebug
    
    # Update baseline references after intentional UX upgrades
    gradle :app:recordRoborazziDebug
    ```

---

## 4. Operational Health Checks (Smoke Testing)

Post-deployment, the continuous integration pipeline (or local `dev.sh` bootstrap) executes automated smoke tests against live endpoints:

*   **Verification Script**: Requests are sent to service health paths to ensure internal integrations are functional.
*   **Health Conditions**:
    *   `/api/gateway/health` -> Expect status code `200` with active container routing status.
    *   `/api/auth/health` -> Expect status code `200` confirming active Postgres connection.
    *   `/api/devices/health` -> Expect status code `200` indicating Redis cache availability.
