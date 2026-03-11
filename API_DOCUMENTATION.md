# Report Come Play - API Documentation

Comprehensive API documentation for the Report Come Play platform. 
This API handles user authentication, scouting report submissions, field management, and administrative payouts.

## 🔗 Base URLs
All endpoints described in this document are relative to the following base URLs:

- **Production Server**: `https://api.comeplayapp.com/api/v1`
- **Local Development Server**: `http://localhost:5000/api/v1`

---

## 🛡️ Authentication Instructions
Most endpoints require a JWT Bearer token. 
To authenticate, use the `/auth/login` endpoint and include the returned token in the headers of subsequent requests:

```http
Authorization: Bearer <your_token>
```
*Tip: Ensure there is a space between `Bearer` and the token value.*

---

## ❌ Common Error Responses
The API uses standard HTTP status codes. Below are common error responses to expect if a request fails:

- **400 Bad Request:** Missing or invalid fields in the request body.
- **401 Unauthorized:** Invalid, expired, or missing Bearer token.
- **403 Forbidden:** The authenticated user does not have permission (e.g., ADMIN only).
- **404 Not Found:** The requested resource (User, Field, Report) does not exist.
- **409 Conflict:** Resource already exists (e.g., email already registered).
- **500 Internal Server Error:** An unexpected error occurred on the server.

A typical error response body looks like this:
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": "UNAUTHORIZED"
}
```

---

## Content Overview
1. [Authentication Endpoints](#authentication-endpoints)
2. [User Operations](#user-operations)
3. [Field Operations](#field-operations)
4. [Report Operations](#report-operations)
5. [Upload](#upload)
6. [Admin Operations](#admin-operations)
7. [Data Models Schema](#data-models-schemas)

---

## Authentication Endpoints

### Register a new user
- **URL:** `/auth/register`
- **Method:** `POST`
- **Responses:** `201 Created`, `409 User already exists`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe",
  "phoneNumber": "+2348000000000"
}
```

### Login user
- **URL:** `/auth/login`
- **Method:** `POST`
- **Responses:** `200 Successful` (Returns Bearer token and User object)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Verify user email
- **URL:** `/auth/verify-email`
- **Method:** `POST`
- **Responses:** `200 Email verified`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### Resend email verification code
- **URL:** `/auth/resend-verification`
- **Method:** `POST`
- **Responses:** `200 Code resent`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Request password reset code
- **URL:** `/auth/forgot-password`
- **Method:** `POST`
- **Responses:** `200 Reset code sent`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Reset password
- **URL:** `/auth/reset-password`
- **Method:** `POST`
- **Responses:** `200 Password updated`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newsecurepassword123"
}
```

### Get current profile
- **URL:** `/auth/me`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 User data`

---

## User Operations

### Get full user profile
- **URL:** `/users/profile`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Profile data`

### Update profile info or bank details
- **URL:** `/users/profile`
- **Method:** `PUT`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Updated`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+2348000000000",
  "avatar": "https://r2.dev/avatars/john.jpg",
  "bankName": "GTBank",
  "accountNumber": "0123456789",
  "accountName": "John Doe"
}
```

### Change password
- **URL:** `/users/change-password`
- **Method:** `PUT`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Changed`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### Get user reports
- **URL:** `/users/reports`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 List of reports`

### Get payout history
- **URL:** `/users/payouts`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 List of payouts`

### Get single payout details
- **URL:** `/users/payouts/{id}`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Payout data`

### Get user notifications
- **URL:** `/users/notifications`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Notifications list`

### Mark all notifications read
- **URL:** `/users/notifications/read-all`
- **Method:** `PUT`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Success`

### Mark specific notification read
- **URL:** `/users/notifications/{id}/read`
- **Method:** `PUT`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Success`

---

## Field Operations

### List all stadiums/fields
- **URL:** `/fields`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 List of fields`

### Submit a new stadium field
- **URL:** `/fields`
- **Method:** `POST`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `201 Created`

**Request Body:**
```json
{
  "name": "Legacy Pitch",
  "location": "Lagos, Nigeria",
  "description": "Standard 11-a-side pitch",
  "images": [
    "https://r2.dev/fields/legacy1.jpg",
    "https://r2.dev/fields/legacy2.jpg"
  ]
}
```

### Get details of a specific field
- **URL:** `/fields/{id}`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Field details`

### Update field information
- **URL:** `/fields/{id}`
- **Method:** `PUT`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Updated`

**Request Body:**
```json
{
  "name": "Updated Legacy Pitch",
  "location": "Lagos, Nigeria",
  "description": "Newly renovated 11-a-side pitch",
  "status": "PENDING",
  "surfaceType": "Artificial Grass",
  "fieldSize": "11v11",
  "images": ["https://r2.dev/fields/legacy1.jpg"]
}
```

### Delete a field
- **URL:** `/fields/{id}`
- **Method:** `DELETE`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Deleted`

---

## Report Operations

### Get all reports
- **URL:** `/reports`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 List`

### Post a scouting intelligence report
- **URL:** `/reports`
- **Method:** `POST`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `201 Submitted`

**Request Body:**
```json
{
  "content": "Pitch surface is 5/5, security is high.",
  "fieldId": "fld123456789"
}
```

### Get single report detail
- **URL:** `/reports/{id}`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Report data`

### Update report
- **URL:** `/reports/{id}`
- **Method:** `PUT`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Updated`

### Delete report
- **URL:** `/reports/{id}`
- **Method:** `DELETE`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 Deleted`

---

## Upload

### Single image upload to R2
- **URL:** `/upload`
- **Method:** `POST`
- **Authentication:** 🔒 Bearer Token required
- **Responses:** `200 JSON with public URL`

**Request Body:** 
Request should be a `multipart/form-data` with a file attached to the `image` key. Example using curl:
```bash
curl -X POST https://api.comeplayapp.com/api/v1/upload \
  -H "Authorization: Bearer <your_token>" \
  -F "image=@/path/to/your/image.jpg"
```

---

## Admin Operations

### Get system-wide statistics
- **URL:** `/admin/stats`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required (ADMIN only)
- **Responses:** `200 Analytics data`

### List all platform users
- **URL:** `/admin/users`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required (ADMIN only)
- **Responses:** `200 Users list`

### Get user details
- **URL:** `/admin/users/{id}`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required (ADMIN only)
- **Responses:** `200 User data`

### Remove user account
- **URL:** `/admin/users/{id}`
- **Method:** `DELETE`
- **Authentication:** 🔒 Bearer Token required (ADMIN only)
- **Responses:** `200 Success`

### Verify/Approve a stadium submission
- **URL:** `/admin/fields/{id}/verify`
- **Method:** `PUT`
- **Authentication:** 🔒 Bearer Token required (ADMIN only)
- **Responses:** `200 Updated`

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

### List all system payouts
- **URL:** `/admin/payouts`
- **Method:** `GET`
- **Authentication:** 🔒 Bearer Token required (ADMIN only)
- **Responses:** `200 Payouts list`

### Disburse a reward to a user
- **URL:** `/admin/payouts`
- **Method:** `POST`
- **Authentication:** 🔒 Bearer Token required (ADMIN only)
- **Responses:** `201 Payout initialized`

**Request Body:**
```json
{
  "userId": "usr123456789",
  "amount": 50000,
  "receiptUrl": "https://r2.dev/receipts/proof.jpg"
}
```

### Update payout status or proof
- **URL:** `/admin/payouts/{id}`
- **Method:** `PUT`
- **Authentication:** 🔒 Bearer Token required (ADMIN only)
- **Responses:** `200 Updated`

---

## Data Models (Schemas)

### User
```typescript
{
  "id": "cln123456789",
  "email": "scout@example.com",
  "fullName": "John Doe",
  "role": "REPORTER" | "OWNER" | "ADMIN",
  "phoneNumber": "+2348000000000",
  "avatar": "https://r2.dev/avatars/john.jpg",
  "emailVerified": true,
  "bankName": "GTBank",
  "accountNumber": "0123456789",
  "accountName": "John Doe"
}
```

### Field
```typescript
{
  "id": "fld123456789",
  "name": "Legacy Pitch",
  "location": "Lagos, Nigeria",
  "description": "Standard 11-a-side pitch",
  "status": "PENDING" | "APPROVED" | "REJECTED",
  "surfaceType": "Artificial Grass",
  "fieldSize": "11v11",
  "ownerId": "usr123456789",
  "images": [
    "https://r2.dev/fields/legacy1.jpg"
  ]
}
```

### Report
```typescript
{
  "id": "rpt123456789",
  "content": "Pitch surface is 5/5, security is high.",
  "status": "PENDING" | "APPROVED" | "REJECTED",
  "userId": "usr123456789",
  "fieldId": "fld123456789",
  "createdAt": "2023-10-12T10:00:00Z"
}
```

### Payout
```typescript
{
  "id": "pay123456789",
  "userId": "usr987654321",
  "amount": 50000,
  "status": "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
  "processedAt": "2023-10-12T12:00:00Z",
  "receiptUrl": "https://r2.dev/receipts/proof.jpg",
  "createdAt": "2023-10-12T10:00:00Z"
}
```
