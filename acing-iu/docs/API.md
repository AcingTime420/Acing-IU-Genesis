# API Specifications — Acing IU

This document details the REST API specifications exposed by the **Acing IU** API Gateway and backend microservices.

---

## 1. Authentication & Session Endpoints

### 1.1 User Registration
*   **Method**: `POST`
*   **Path**: `/api/auth/register`
*   **Request Body**:
    ```json
    {
      "email": "user@domain.com",
      "password": "SecurePassword123!"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "userId": "a73cb951-6efc-4e8c-8be9-e09fa8430b21",
      "email": "user@domain.com",
      "message": "User registered successfully."
    }
    ```

---

### 1.2 User Login
*   **Method**: `POST`
*   **Path**: `/api/auth/login`
*   **Request Body**:
    ```json
    {
      "email": "user@domain.com",
      "password": "SecurePassword123!"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "7c98de6b-965a-49e0-8da1-85bbf1ee4fa7",
      "mfaRequired": false,
      "expiresIn": 900
    }
    ```

---

### 1.3 Token Refresh
*   **Method**: `POST`
*   **Path**: `/api/auth/refresh`
*   **Request Body**:
    ```json
    {
      "refreshToken": "7c98de6b-965a-49e0-8da1-85bbf1ee4fa7"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "f8a032de-3bc5-442b-92ee-90a3de07b66a",
      "expiresIn": 900
    }
    ```

---

## 2. Multi-Factor Authentication (MFA)

### 2.1 Enable MFA (Initiate)
*   **Method**: `POST`
*   **Path**: `/api/security/mfa/enable`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "secretKey": "NBSWY3DPEB3W64TBNQ",
      "qrCodeUri": "otpauth://totp/Acing%20IU:user@domain.com?secret=NBSWY3DPEB3W64TBNQ&issuer=Acing%20IU"
    }
    ```

---

### 2.2 Verify and Complete MFA Activation
*   **Method**: `POST`
*   **Path**: `/api/security/mfa/verify`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "code": "123456"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "enabled": true,
      "recoveryCodes": [
        "ABCD-1234-EFGH",
        "IJKL-5678-MNOP"
      ]
    }
    ```

---

## 3. Device Trust Endpoints

### 3.1 Register / Profile Device
*   **Method**: `POST`
*   **Path**: `/api/devices/register`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "name": "Mick's iPhone 15",
      "platform": "iOS",
      "osVersion": "17.4.1",
      "appVersion": "1.0.0"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "deviceId": "b5722f98-9031-41fa-8ba2-45de190a980c",
      "trustScore": 100,
      "complianceLevel": "Trusted",
      "certificateSerial": "CERT-9031-41FA"
    }
    ```

---

### 3.2 Fetch Registered Devices
*   **Method**: `GET`
*   **Path**: `/api/devices`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    [
      {
        "deviceId": "b5722f98-9031-41fa-8ba2-45de190a980c",
        "name": "Mick's iPhone 15",
        "platform": "iOS",
        "trustScore": 100,
        "isQuarantined": false,
        "lastSeen": "2026-06-26T11:50:00Z"
      }
    ]
    ```

---

## 4. Policy and Auditing (Admin-Only)

### 4.1 Update System Access Policy
*   **Method**: `PUT`
*   **Path**: `/api/policies/{id}`
*   **Headers**: `Authorization: Bearer <token>` (Requires `policy.write` permission)
*   **Request Body**:
    ```json
    {
      "minTrustScore": 85,
      "requireMfa": true,
      "allowedRoles": "Admin,Operator"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "policyId": "d381c0bc-fca2-480c-a9e9-110fae12089b",
      "message": "Policy updated successfully."
    }
    ```

---

### 4.2 Fetch Audit Trail
*   **Method**: `GET`
*   **Path**: `/api/audit`
*   **Headers**: `Authorization: Bearer <token>` (Requires `audit.read` permission)
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "e44cb89a-09ab-44df-be09-00ab55f84bc1",
        "userId": "a73cb951-6efc-4e8c-8be9-e09fa8430b21",
        "action": "POLICY_MODIFIED",
        "status": "SUCCESS",
        "ipAddress": "192.168.1.50",
        "timestamp": "2026-06-26T11:51:30Z"
      }
    ]
    ```
