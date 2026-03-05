# 📖 Report Come Play — Full API Documentation

> **Version:** 1.0.0  
> **Base URL (Local):** `http://localhost:5000/api/v1`  
> **Total Endpoints:** 34

---

## Table of Contents

1. [General Information](#-general-information)
2. [Authentication Endpoints (5)](#-1-authentication-apiv1auth)
3. [User Endpoints (8)](#-2-user-operations-apiv1users)
4. [Field Endpoints (5)](#-3-field-intelligence-apiv1fields)
5. [Report Endpoints (5)](#-4-reports-apiv1reports)
6. [Admin Endpoints (8)](#-5-admin-controls-apiv1admin)
7. [Upload Endpoint (1)](#-6-file-upload-apiv1upload)
8. [System Endpoints (2)](#-7-system--health-checks)
9. [Database Models](#-database-models)
10. [Error Codes](#-error-codes)
11. [Rate Limiting](#-rate-limiting)
12. [Environment Variables](#-environment-variables)

---

## 🌐 General Information

### Authentication

All protected routes require a **JWT Bearer token** in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Content Type

All request bodies must be `application/json` unless otherwise specified (e.g., file uploads use `multipart/form-data`).

### Standard Response Envelope

Every response follows this structure:

```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { }
}
```

On error:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔐 1. Authentication (`/api/v1/auth`)

### 1.1 POST `/auth/register`

Register a new user account.

- **Auth Required:** No
- **Rate Limit:** 10 requests / 15 min

**Request Body:**

| Field        | Type   | Required | Description                          |
|--------------|--------|----------|--------------------------------------|
| `email`      | String | ✅       | Valid email address                  |
| `password`   | String | ✅       | Min 6 chars, must contain 1 number   |
| `fullName`   | String | ✅       | User's full name                     |
| `role`       | String | Optional | `REPORTER` (default) or `OWNER`      |
| `phoneNumber`| String | Optional | Phone number                         |

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "MyPass123",
  "fullName": "John Doe",
  "role": "REPORTER",
  "phoneNumber": "+2348012345678"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for the verification code.",
  "data": {
    "user": {
      "id": "cm1abc2def3ghi",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "REPORTER",
      "emailVerified": false,
      "createdAt": "2026-03-05T01:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` — Validation failure (missing fields, weak password)
- `409` — Email already registered and verified
- `429` — Rate limit exceeded

---

### 1.2 POST `/auth/login`

Log in an existing user.

- **Auth Required:** No
- **Rate Limit:** 10 requests / 15 min

**Request Body:**

| Field      | Type   | Required | Description         |
|------------|--------|----------|---------------------|
| `email`    | String | ✅       | Registered email    |
| `password` | String | ✅       | Account password    |

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "MyPass123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "cm1abc2def3ghi",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "REPORTER",
      "emailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` — Validation failure
- `401` — Invalid email or password
- `403` — Email not verified (returns `needsVerification: true`, `userId`, `email`)

**Unverified Email Response (403):**
```json
{
  "success": false,
  "message": "Email not verified. Please check your email for the verification code.",
  "needsVerification": true,
  "userId": "cm1abc2def3ghi",
  "email": "john@example.com"
}
```

---

### 1.3 POST `/auth/verify-email`

Verify a user's email with the 6-digit code sent to their inbox.

- **Auth Required:** No

**Request Body:**

| Field    | Type   | Required | Description           |
|----------|--------|----------|-----------------------|
| `userId` | String | ✅       | User ID from register |
| `code`   | String | ✅       | 6-digit code          |

**Example Request:**
```json
{
  "userId": "cm1abc2def3ghi",
  "code": "482716"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

**Error Responses:**
- `400` — Invalid code or expired code (`expired: true`)
- `404` — User not found

---

### 1.4 POST `/auth/resend-verification`

Resend the verification code email.

- **Auth Required:** No
- **Rate Limit:** 10 requests / 15 min

**Request Body:**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `userId` | String | ✅       | User ID     |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code resent successfully.",
  "expiresIn": 900
}
```

**Error Responses:**
- `400` — Email already verified
- `404` — User not found
- `429` — Must wait 60 seconds between resend attempts (returns `waitTime` in seconds)

---

### 1.5 GET `/auth/me`

Get the currently authenticated user's info.

- **Auth Required:** ✅ Bearer Token

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm1abc2def3ghi",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "REPORTER",
      "phoneNumber": "+2348012345678",
      "emailVerified": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-04T15:30:00.000Z"
    }
  }
}
```

---

## 👤 2. User Operations (`/api/v1/users`)

> **All user routes require authentication (Bearer Token).**

### 2.1 GET `/users/profile`

Get the full profile of the logged-in user.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm1abc2def3ghi",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "REPORTER",
      "avatar": "https://xxxxx.supabase.co/storage/v1/object/public/field-images/uploads/uuid.jpg",
      "phoneNumber": "+2348012345678",
      "bankName": "GTBank",
      "accountNumber": "0123456789",
      "accountName": "John Doe",
      "emailVerified": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-04T15:30:00.000Z"
    }
  }
}
```

---

### 2.2 PUT `/users/profile`

Update the logged-in user's profile. All fields are optional; only provided fields are updated.

**Request Body (all optional):**

| Field           | Type   | Description                  |
|-----------------|--------|------------------------------|
| `fullName`      | String | Updated full name            |
| `phoneNumber`   | String | Phone number                 |
| `avatar`        | String | URL to avatar image          |
| `bankName`      | String | Bank name                    |
| `accountNumber` | String | Bank account number          |
| `accountName`   | String | Name on the bank account     |

**Example Request:**
```json
{
  "bankName": "First Bank",
  "accountNumber": "3012345678",
  "accountName": "John Doe"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "user": {
      "id": "cm1abc2def3ghi",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "REPORTER",
      "avatar": null,
      "phoneNumber": "+2348012345678",
      "bankName": "First Bank",
      "accountNumber": "3012345678",
      "accountName": "John Doe",
      "emailVerified": true,
      "updatedAt": "2026-03-05T01:50:00.000Z"
    }
  }
}
```

---

### 2.3 PUT `/users/change-password`

Change the logged-in user's password.

**Request Body:**

| Field             | Type   | Required | Description             |
|-------------------|--------|----------|-------------------------|
| `currentPassword` | String | ✅       | Current account password|
| `newPassword`     | String | ✅       | New password            |

**Example Request:**
```json
{
  "currentPassword": "MyPass123",
  "newPassword": "NewSecure456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

**Error Responses:**
- `400` — Current password is incorrect

---

### 2.4 GET `/users/reports`

Get the logged-in user's own submitted reports (paginated).

**Query Parameters:**

| Param   | Type    | Default | Description         |
|---------|---------|---------|---------------------|
| `page`  | Integer | 1       | Page number         |
| `limit` | Integer | 10      | Results per page    |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "cm1report123",
        "content": "The pitch has poor drainage and uneven markings.",
        "status": "PENDING",
        "userId": "cm1abc2def3ghi",
        "fieldId": "cm1field456",
        "createdAt": "2026-03-04T12:00:00.000Z",
        "updatedAt": "2026-03-04T12:00:00.000Z",
        "field": {
          "id": "cm1field456",
          "name": "Eagle Square Mini Pitch",
          "location": "Central Area, Abuja"
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

### 2.5 GET `/users/payouts`

Get the logged-in user's payout history.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "id": "cm1payout789",
        "userId": "cm1abc2def3ghi",
        "amount": 25000,
        "status": "COMPLETED",
        "receiptUrl": "https://xxxx.supabase.co/storage/v1/.../receipt.png",
        "createdAt": "2026-03-03T08:00:00.000Z",
        "processedAt": "2026-03-03T10:30:00.000Z"
      },
      {
        "id": "cm1payoutabc",
        "userId": "cm1abc2def3ghi",
        "amount": 15000,
        "status": "PENDING",
        "receiptUrl": null,
        "createdAt": "2026-03-05T01:00:00.000Z",
        "processedAt": null
      }
    ]
  }
}
```

---

### 2.6 GET `/users/notifications`

Get the last 20 notifications for the logged-in user.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "cm1notif001",
        "userId": "cm1abc2def3ghi",
        "title": "Protocol Update: Field Approved",
        "message": "Intelligence submission \"Eagle Square Mini Pitch\" has been approved by administration.",
        "read": false,
        "type": "SUCCESS",
        "createdAt": "2026-03-05T00:30:00.000Z",
        "updatedAt": "2026-03-05T00:30:00.000Z"
      },
      {
        "id": "cm1notif002",
        "userId": "cm1abc2def3ghi",
        "title": "Payout Sent",
        "message": "You have received a payout of ₦25,000.",
        "read": true,
        "type": "SUCCESS",
        "createdAt": "2026-03-03T10:30:00.000Z",
        "updatedAt": "2026-03-03T11:00:00.000Z"
      }
    ]
  }
}
```

---

### 2.7 PUT `/users/notifications/:id/read`

Mark a single notification as read.

**URL Parameters:**

| Param | Type   | Description     |
|-------|--------|-----------------|
| `id`  | String | Notification ID |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read."
}
```

---

### 2.8 PUT `/users/notifications/read-all`

Mark all unread notifications as read for the logged-in user.

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

---

## 🏟️ 3. Field Intelligence (`/api/v1/fields`)

> **All field routes require authentication (Bearer Token).**

### 3.1 GET `/fields`

List fields. Admin sees all fields. Non-admins see only their own submitted fields.

**Query Parameters:**

| Param    | Type    | Default | Description                                     |
|----------|---------|---------|--------------------------------------------------|
| `page`   | Integer | 1       | Page number                                      |
| `limit`  | Integer | 10      | Results per page                                 |
| `status` | String  | —       | Filter: `PENDING`, `APPROVED`, or `REJECTED`     |
| `ownerId`| String  | —       | (Admin only) Filter by a specific owner's ID     |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "id": "cm1field456",
        "name": "Eagle Square Mini Pitch",
        "location": "Central Area, Abuja",
        "description": "High-quality synthetic turf field.",
        "status": "PENDING",
        "surfaceType": "Synthetic",
        "fieldSize": "5-a-side",
        "availability": "Weekdays 9am-6pm",
        "contactInfo": "+234801234567",
        "access": "Public",
        "managerName": "Ade Johnson",
        "managerContact": "+234809876543",
        "latitude": 9.0578,
        "longitude": 7.4951,
        "images": [
          "https://xxxx.supabase.co/.../img1.jpg",
          "https://xxxx.supabase.co/.../img2.jpg",
          "https://xxxx.supabase.co/.../img3.jpg"
        ],
        "ownerId": "cm1abc2def3ghi",
        "createdAt": "2026-03-04T12:00:00.000Z",
        "updatedAt": "2026-03-04T12:00:00.000Z",
        "owner": {
          "id": "cm1abc2def3ghi",
          "fullName": "John Doe",
          "email": "john@example.com",
          "bankName": "GTBank",
          "accountNumber": "0123456789",
          "accountName": "John Doe",
          "role": "REPORTER"
        },
        "_count": {
          "reports": 2
        }
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

### 3.2 GET `/fields/:id`

Get a single field by ID, including its last 10 reports.

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | Field ID    |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "field": {
      "id": "cm1field456",
      "name": "Eagle Square Mini Pitch",
      "location": "Central Area, Abuja",
      "description": "High-quality synthetic turf field.",
      "status": "APPROVED",
      "surfaceType": "Synthetic",
      "fieldSize": "5-a-side",
      "availability": "Weekdays 9am-6pm",
      "contactInfo": "+234801234567",
      "access": "Public",
      "managerName": "Ade Johnson",
      "managerContact": "+234809876543",
      "latitude": 9.0578,
      "longitude": 7.4951,
      "images": ["url1", "url2", "url3"],
      "ownerId": "cm1abc2def3ghi",
      "createdAt": "2026-03-04T12:00:00.000Z",
      "updatedAt": "2026-03-04T14:00:00.000Z",
      "owner": {
        "id": "cm1abc2def3ghi",
        "fullName": "John Doe",
        "email": "john@example.com",
        "bankName": "GTBank",
        "accountNumber": "0123456789",
        "accountName": "John Doe",
        "role": "REPORTER"
      },
      "reports": [
        {
          "id": "cm1report001",
          "content": "Pitch markings are faded.",
          "status": "PENDING",
          "userId": "cm1userabc",
          "fieldId": "cm1field456",
          "createdAt": "2026-03-04T15:00:00.000Z",
          "updatedAt": "2026-03-04T15:00:00.000Z",
          "user": {
            "id": "cm1userabc",
            "fullName": "Jane Reporter"
          }
        }
      ]
    }
  }
}
```

**Error Response:**
- `404` — Field not found

---

### 3.3 POST `/fields`

Submit a new field. Includes **fuzzy duplicate detection** (75% similarity threshold on name OR location).

- **Auth Required:** ✅ Bearer Token
- **Role Required:** `REPORTER`, `OWNER`, or `ADMIN`
- **Rate Limit:** 20 requests / hour

**Request Body:**

| Field            | Type     | Required | Description                                                    |
|------------------|----------|----------|----------------------------------------------------------------|
| `name`           | String   | ✅       | Field name                                                     |
| `location`       | String   | ✅       | Field address/location                                         |
| `description`    | String   | Optional | Detailed description                                           |
| `surfaceType`    | String   | Optional | `Natural Grass`, `Synthetic`, `Astro Turf`, `Clay`, `Sand`, `Rubber`, `Concrete`, `Hybrid` |
| `fieldSize`      | String   | Optional | `5-a-side`, `7-a-side`, `9-a-side`, `11-a-side`, `Mini Pitch`, `Futsal` |
| `availability`   | String   | Optional | Availability schedule                                          |
| `contactInfo`    | String   | Optional | Contact phone/email                                            |
| `access`         | String   | Optional | Access type (Public, Private, etc.)                            |
| `managerName`    | String   | Optional | Name of field manager                                          |
| `managerContact` | String   | Optional | Field manager's contact                                        |
| `latitude`       | Float    | Optional | GPS latitude                                                   |
| `longitude`      | Float    | Optional | GPS longitude                                                  |
| `images`         | String[] | ✅       | **Exactly 3** Supabase image URLs                              |

**Example Request:**
```json
{
  "name": "Eagle Square Mini Pitch",
  "location": "Central Area, Abuja",
  "description": "High-quality synthetic turf with floodlights.",
  "surfaceType": "Synthetic",
  "fieldSize": "5-a-side",
  "availability": "Weekdays 9am - 6pm",
  "contactInfo": "+234801234567",
  "access": "Public",
  "managerName": "Ade Johnson",
  "managerContact": "+234809876543",
  "latitude": 9.0578,
  "longitude": 7.4951,
  "images": [
    "https://xxxx.supabase.co/.../img1.jpg",
    "https://xxxx.supabase.co/.../img2.jpg",
    "https://xxxx.supabase.co/.../img3.jpg"
  ]
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Field created successfully.",
  "data": {
    "field": {
      "id": "cm1fieldnew789",
      "name": "Eagle Square Mini Pitch",
      "location": "Central Area, Abuja",
      "description": "High-quality synthetic turf with floodlights.",
      "status": "PENDING",
      "surfaceType": "Synthetic",
      "fieldSize": "5-a-side",
      "availability": "Weekdays 9am - 6pm",
      "contactInfo": "+234801234567",
      "access": "Public",
      "managerName": "Ade Johnson",
      "managerContact": "+234809876543",
      "latitude": 9.0578,
      "longitude": 7.4951,
      "images": ["url1", "url2", "url3"],
      "ownerId": "cm1abc2def3ghi",
      "createdAt": "2026-03-05T01:55:00.000Z",
      "updatedAt": "2026-03-05T01:55:00.000Z",
      "owner": {
        "id": "cm1abc2def3ghi",
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Error Responses:**
- `400` — Missing required fields, or images array is not exactly 3
- `409` — Duplicate field detected (fuzzy match)

**Duplicate Response (409):**
```json
{
  "success": false,
  "message": "Duplicate Alert! It looks like this field has already been reported as \"Eagle Square Pitch\" at \"Central Area, Abuja\". No need to submit it again!"
}
```

---

### 3.4 PUT `/fields/:id`

Update an existing field. Only the field owner or an admin can update.

- **Role Required:** `OWNER` or `ADMIN`

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | Field ID    |

**Request Body:** Same fields as POST (all optional). Only admin can update `status`.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Field updated successfully.",
  "data": {
    "field": { "...same structure as GET /fields/:id..." }
  }
}
```

**Error Responses:**
- `403` — Not owner of this field
- `404` — Field not found

---

### 3.5 DELETE `/fields/:id`

Delete a field. Only the field owner or an admin can delete.

- **Role Required:** `OWNER` or `ADMIN`

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | Field ID    |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Field deleted successfully."
}
```

**Error Responses:**
- `403` — Not owner of this field
- `404` — Field not found

---

## 📝 4. Reports (`/api/v1/reports`)

> **All report routes require authentication (Bearer Token).**

### 4.1 GET `/reports`

List reports. Admin sees all reports; non-admins see only their own.

**Query Parameters:**

| Param    | Type    | Default | Description                              |
|----------|---------|---------|------------------------------------------|
| `page`   | Integer | 1       | Page number                              |
| `limit`  | Integer | 10      | Results per page                         |
| `status` | String  | —       | Filter: `PENDING`, `APPROVED`, `REJECTED`|
| `fieldId`| String  | —       | Filter by field ID                       |
| `userId` | String  | —       | (Admin only) Filter by user ID           |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "cm1report001",
        "content": "The pitch has poor drainage and uneven markings.",
        "status": "PENDING",
        "userId": "cm1abc2def3ghi",
        "fieldId": "cm1field456",
        "createdAt": "2026-03-04T12:00:00.000Z",
        "updatedAt": "2026-03-04T12:00:00.000Z",
        "user": {
          "id": "cm1abc2def3ghi",
          "fullName": "John Doe",
          "email": "john@example.com",
          "role": "REPORTER"
        },
        "field": {
          "id": "cm1field456",
          "name": "Eagle Square Mini Pitch",
          "location": "Central Area, Abuja"
        }
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

---

### 4.2 GET `/reports/:id`

Get a single report by ID.

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | Report ID   |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "report": {
      "id": "cm1report001",
      "content": "The pitch has poor drainage and uneven markings.",
      "status": "PENDING",
      "userId": "cm1abc2def3ghi",
      "fieldId": "cm1field456",
      "createdAt": "2026-03-04T12:00:00.000Z",
      "updatedAt": "2026-03-04T12:00:00.000Z",
      "user": {
        "id": "cm1abc2def3ghi",
        "fullName": "John Doe",
        "email": "john@example.com",
        "role": "REPORTER"
      },
      "field": {
        "id": "cm1field456",
        "name": "Eagle Square Mini Pitch",
        "location": "Central Area, Abuja",
        "description": "High-quality synthetic turf field."
      }
    }
  }
}
```

**Error Response:**
- `404` — Report not found

---

### 4.3 POST `/reports`

Create a new report on a field.

- **Rate Limit:** 20 requests / hour

**Request Body:**

| Field     | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| `content` | String | ✅       | Report content / description   |
| `fieldId` | String | ✅       | ID of the field being reported |

**Example Request:**
```json
{
  "content": "The pitch has poor drainage and uneven markings.",
  "fieldId": "cm1field456"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Report created successfully.",
  "data": {
    "report": {
      "id": "cm1reportnew123",
      "content": "The pitch has poor drainage and uneven markings.",
      "status": "PENDING",
      "userId": "cm1abc2def3ghi",
      "fieldId": "cm1field456",
      "createdAt": "2026-03-05T01:55:00.000Z",
      "updatedAt": "2026-03-05T01:55:00.000Z",
      "user": {
        "id": "cm1abc2def3ghi",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "field": {
        "id": "cm1field456",
        "name": "Eagle Square Mini Pitch",
        "location": "Central Area, Abuja"
      }
    }
  }
}
```

**Error Responses:**
- `400` — Missing required fields
- `404` — Field not found

---

### 4.4 PUT `/reports/:id`

Update a report. Only the report owner or admin can update. Only admin can change `status`.

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | Report ID   |

**Request Body (all optional):**

| Field     | Type   | Description                                                   |
|-----------|--------|---------------------------------------------------------------|
| `content` | String | Updated content                                               |
| `status`  | String | (Admin only) `PENDING`, `APPROVED`, or `REJECTED`             |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Report updated successfully.",
  "data": {
    "report": { "...same structure as GET /reports/:id..." }
  }
}
```

**Side Effect:** If admin changes the status, a notification is automatically created for the report owner.

**Error Responses:**
- `403` — Not owner of this report
- `404` — Report not found

---

### 4.5 DELETE `/reports/:id`

Delete a report. Only the report owner or admin can delete.

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | Report ID   |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Report deleted successfully."
}
```

**Error Responses:**
- `403` — Not owner of this report
- `404` — Report not found

---

## 🛡️ 5. Admin Controls (`/api/v1/admin`)

> **All admin routes require authentication (Bearer Token) AND `ADMIN` role.**

### 5.1 GET `/admin/stats`

Get full dashboard statistics including user counts, field statuses, payout data, 7-day charts, recent activity, and top reporters.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "users": {
        "total": 45,
        "reporters": 30,
        "owners": 15
      },
      "fields": {
        "total": 25,
        "pending": 8,
        "approved": 14,
        "rejected": 3
      },
      "reports": {
        "total": 60,
        "pending": 12
      },
      "payouts": {
        "total": 20,
        "pending": 5,
        "pendingAmount": 125000
      }
    },
    "charts": [
      { "date": "Sat", "submissions": 2, "newUsers": 1, "activeUsers": 3 },
      { "date": "Sun", "submissions": 0, "newUsers": 0, "activeUsers": 0 },
      { "date": "Mon", "submissions": 5, "newUsers": 3, "activeUsers": 6 },
      { "date": "Tue", "submissions": 3, "newUsers": 2, "activeUsers": 4 },
      { "date": "Wed", "submissions": 1, "newUsers": 0, "activeUsers": 2 },
      { "date": "Thu", "submissions": 4, "newUsers": 1, "activeUsers": 5 },
      { "date": "Fri", "submissions": 2, "newUsers": 2, "activeUsers": 3 }
    ],
    "recentActivity": [
      {
        "id": "cm1field001",
        "name": "Eagle Square Mini Pitch",
        "location": "Central Area, Abuja",
        "status": "PENDING",
        "createdAt": "2026-03-05T01:00:00.000Z",
        "owner": {
          "fullName": "John Doe",
          "email": "john@example.com"
        }
      },
      {
        "id": "cm1field002",
        "name": "Victoria Island Pitch",
        "location": "Lagos, Nigeria",
        "status": "APPROVED",
        "createdAt": "2026-03-04T18:00:00.000Z",
        "owner": {
          "fullName": "Jane Smith",
          "email": "jane@example.com"
        }
      }
    ],
    "topReporters": [
      { "name": "John Doe", "fields": 8, "approved": 6 },
      { "name": "Jane Smith", "fields": 5, "approved": 4 },
      { "name": "Mike Lagos", "fields": 3, "approved": 2 }
    ]
  }
}
```

---

### 5.2 GET `/admin/users`

Get a paginated list of all non-admin users.

**Query Parameters:**

| Param   | Type    | Default | Description                                  |
|---------|---------|---------|----------------------------------------------|
| `page`  | Integer | 1       | Page number                                  |
| `limit` | Integer | 20      | Results per page                             |
| `role`  | String  | —       | Filter: `REPORTER`, `OWNER`, or unset for all non-admins |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "cm1abc2def3ghi",
        "email": "john@example.com",
        "fullName": "John Doe",
        "role": "REPORTER",
        "phoneNumber": "+2348012345678",
        "bankName": "GTBank",
        "accountNumber": "0123456789",
        "accountName": "John Doe",
        "emailVerified": true,
        "createdAt": "2026-03-01T10:00:00.000Z",
        "_count": {
          "reports": 5,
          "ownedFields": 3,
          "payouts": 2
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

---

### 5.3 GET `/admin/users/:id`

Get a single user's full dossier by ID.

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | User ID     |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cm1abc2def3ghi",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "REPORTER",
    "phoneNumber": "+2348012345678",
    "bankName": "GTBank",
    "accountNumber": "0123456789",
    "accountName": "John Doe",
    "emailVerified": true,
    "createdAt": "2026-03-01T10:00:00.000Z",
    "_count": {
      "reports": 5,
      "ownedFields": 3,
      "payouts": 2
    }
  }
}
```

**Error Response:**
- `404` — User not found

---

### 5.4 DELETE `/admin/users/:id`

Permanently delete a user. Cannot delete admin accounts.

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | User ID     |

**Success Response (200):**
```json
{
  "success": true,
  "message": "User access has been permanently terminated."
}
```

**Error Responses:**
- `403` — Cannot delete an administrator account
- `404` — User not found

---

### 5.5 GET `/admin/payouts`

Get a paginated list of all payouts.

**Query Parameters:**

| Param    | Type    | Default | Description                                          |
|----------|---------|---------|------------------------------------------------------|
| `page`   | Integer | 1       | Page number                                          |
| `limit`  | Integer | 20      | Results per page                                     |
| `status` | String  | —       | Filter: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`|
| `userId` | String  | —       | Filter payouts for a specific user                   |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "id": "cm1payout789",
        "userId": "cm1abc2def3ghi",
        "amount": 25000,
        "status": "COMPLETED",
        "receiptUrl": "https://xxxx.supabase.co/.../receipt.png",
        "createdAt": "2026-03-03T08:00:00.000Z",
        "processedAt": "2026-03-03T10:30:00.000Z",
        "user": {
          "id": "cm1abc2def3ghi",
          "fullName": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

---

### 5.6 POST `/admin/payouts`

Create a new payout for a user.

**Request Body:**

| Field        | Type   | Required | Description                                            |
|--------------|--------|----------|--------------------------------------------------------|
| `userId`     | String | ✅       | User to pay out                                        |
| `amount`     | Number | ✅       | Amount in Naira (₦)                                   |
| `status`     | String | Optional | Initial status: `PENDING` (default), `COMPLETED`, etc. |
| `receiptUrl` | String | Optional | URL to payment receipt image                           |

**Example Request:**
```json
{
  "userId": "cm1abc2def3ghi",
  "amount": 25000,
  "status": "COMPLETED",
  "receiptUrl": "https://xxxx.supabase.co/.../receipt.png"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Payout created successfully.",
  "data": {
    "payout": {
      "id": "cm1payoutnew001",
      "userId": "cm1abc2def3ghi",
      "amount": 25000,
      "status": "COMPLETED",
      "receiptUrl": "https://xxxx.supabase.co/.../receipt.png",
      "createdAt": "2026-03-05T01:55:00.000Z",
      "processedAt": "2026-03-05T01:55:00.000Z",
      "user": {
        "id": "cm1abc2def3ghi",
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Side Effect:** If `status` is `COMPLETED`, a notification is created for the user: *"You have received a payout of ₦25,000."*

**Error Response:**
- `404` — User not found

---

### 5.7 PUT `/admin/payouts/:id`

Update an existing payout's status and/or receipt.

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | Payout ID   |

**Request Body:**

| Field        | Type   | Required | Description                                                |
|--------------|--------|----------|------------------------------------------------------------|
| `status`     | String | ✅       | `PENDING`, `PROCESSING`, `COMPLETED`, or `FAILED`          |
| `receiptUrl` | String | Optional | URL to payment receipt                                     |

**Example Request:**
```json
{
  "status": "COMPLETED",
  "receiptUrl": "https://xxxx.supabase.co/.../receipt.png"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payout updated successfully.",
  "data": {
    "payout": {
      "id": "cm1payout789",
      "userId": "cm1abc2def3ghi",
      "amount": 25000,
      "status": "COMPLETED",
      "receiptUrl": "https://xxxx.supabase.co/.../receipt.png",
      "createdAt": "2026-03-03T08:00:00.000Z",
      "processedAt": "2026-03-05T02:00:00.000Z",
      "user": {
        "id": "cm1abc2def3ghi",
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Side Effect:** A notification is always created for the user with the updated status.

---

### 5.8 PUT `/admin/fields/:id/verify`

Verify (approve or reject) a submitted field.

**URL Parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | String | Field ID    |

**Request Body:**

| Field    | Type   | Required | Description                        |
|----------|--------|----------|------------------------------------|
| `status` | String | ✅       | Must be `APPROVED` or `REJECTED`   |

**Example Request:**
```json
{
  "status": "APPROVED"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Field approved successfully.",
  "data": {
    "field": {
      "id": "cm1field456",
      "name": "Eagle Square Mini Pitch",
      "location": "Central Area, Abuja",
      "description": "High-quality synthetic turf field.",
      "status": "APPROVED",
      "surfaceType": "Synthetic",
      "fieldSize": "5-a-side",
      "availability": "Weekdays 9am-6pm",
      "contactInfo": "+234801234567",
      "access": "Public",
      "managerName": "Ade Johnson",
      "managerContact": "+234809876543",
      "latitude": 9.0578,
      "longitude": 7.4951,
      "images": ["url1", "url2", "url3"],
      "ownerId": "cm1abc2def3ghi",
      "createdAt": "2026-03-04T12:00:00.000Z",
      "updatedAt": "2026-03-05T02:00:00.000Z",
      "owner": {
        "id": "cm1abc2def3ghi",
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Side Effect:** A notification is automatically created for the field owner informing them of the approval or rejection.

**Error Response:**
- `400` — Invalid status (not APPROVED or REJECTED)

---

## 📤 6. File Upload (`/api/v1/upload`)

### 6.1 POST `/upload`

Upload a single image to Supabase Storage.

- **Auth Required:** ✅ Bearer Token
- **Rate Limit:** 20 requests / hour
- **Content-Type:** `multipart/form-data`
- **Max File Size:** 5 MB

**Request Body (FormData):**

| Field   | Type | Required | Description              |
|---------|------|----------|--------------------------|
| `image` | File | ✅       | Image file (jpg, png, webp, etc.) |

**Success Response (200):**
```json
{
  "success": true,
  "url": "https://xxxxxxxxxxxxx.supabase.co/storage/v1/object/public/field-images/uploads/a1b2c3d4-uuid.jpg"
}
```

**Error Responses:**
- `400` — No file uploaded
- `500` — Supabase storage error

---

## ⚙️ 7. System / Health Checks

### 7.1 GET `/`

Root health check. No authentication required.

**Response (200):**
```json
{
  "success": true,
  "message": "Report Come Play API is running!",
  "version": "1.0.0"
}
```

### 7.2 GET `/health`

Detailed health check with timestamp.

**Response (200):**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2026-03-05T01:55:00.000Z"
}
```

---

## 🗄️ Database Models

### User

| Column                   | Type     | Notes                                        |
|--------------------------|----------|----------------------------------------------|
| `id`                     | String   | CUID, primary key                            |
| `email`                  | String   | Unique                                       |
| `password`               | String   | Bcrypt hashed                                |
| `fullName`               | String   |                                              |
| `role`                   | String   | `REPORTER`, `OWNER`, `ADMIN`                 |
| `phoneNumber`            | String?  |                                              |
| `avatar`                 | String?  | Supabase URL                                 |
| `bankName`               | String?  |                                              |
| `accountNumber`          | String?  |                                              |
| `accountName`            | String?  |                                              |
| `emailVerified`          | Boolean  | Default `false`                              |
| `verificationCode`       | String?  | 6-digit code                                 |
| `verificationCodeExpiry` | DateTime?| Expires 15 min after generation              |
| `createdAt`              | DateTime | Auto-generated                               |
| `updatedAt`              | DateTime | Auto-updated                                 |

### Field

| Column          | Type     | Notes                                       |
|-----------------|----------|---------------------------------------------|
| `id`            | String   | CUID, primary key                           |
| `name`          | String   | Field name                                  |
| `location`      | String   | Address                                     |
| `description`   | String?  |                                             |
| `status`        | String   | `PENDING`, `APPROVED`, `REJECTED`           |
| `surfaceType`   | String?  |                                             |
| `fieldSize`     | String?  |                                             |
| `availability`  | String?  |                                             |
| `contactInfo`   | String?  |                                             |
| `access`        | String?  |                                             |
| `managerName`   | String?  |                                             |
| `managerContact`| String?  |                                             |
| `latitude`      | Float?   | GPS coordinate                              |
| `longitude`     | Float?   | GPS coordinate                              |
| `images`        | Json     | Array of exactly 3 URLs                     |
| `ownerId`       | String   | FK → User                                   |
| `createdAt`     | DateTime |                                             |
| `updatedAt`     | DateTime |                                             |

### Report

| Column     | Type     | Notes                                      |
|------------|----------|--------------------------------------------|
| `id`       | String   | CUID                                       |
| `content`  | String   | Report text                                |
| `status`   | String   | `PENDING`, `APPROVED`, `REJECTED`          |
| `userId`   | String   | FK → User (who submitted)                  |
| `fieldId`  | String   | FK → Field (what field)                    |
| `createdAt`| DateTime |                                            |
| `updatedAt`| DateTime |                                            |

### Payout

| Column       | Type      | Notes                                     |
|--------------|-----------|-------------------------------------------|
| `id`         | String    | CUID                                      |
| `userId`     | String    | FK → User                                 |
| `amount`     | Float     | Amount in Naira (₦)                       |
| `status`     | String    | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `receiptUrl` | String?   | URL to receipt image                       |
| `createdAt`  | DateTime  |                                           |
| `processedAt`| DateTime? | When payout was completed                  |

### Notification

| Column     | Type     | Notes                                       |
|------------|----------|---------------------------------------------|
| `id`       | String   | CUID                                        |
| `userId`   | String   | FK → User                                   |
| `title`    | String   | Title of notification                       |
| `message`  | String   | Full notification message                   |
| `read`     | Boolean  | Default `false`                             |
| `type`     | String   | `INFO`, `SUCCESS`, `WARNING`, `ERROR`       |
| `createdAt`| DateTime |                                             |
| `updatedAt`| DateTime |                                             |

### Admin

| Column       | Type     | Notes                                      |
|--------------|----------|--------------------------------------------|
| `id`         | String   | CUID                                       |
| `userId`     | String   | FK → User (unique)                         |
| `permissions`| Json     | Permissions object                         |
| `createdAt`  | DateTime |                                            |

---

## ⚠️ Error Codes

| Code  | Meaning                | When It Happens                                                  |
|-------|------------------------|------------------------------------------------------------------|
| `200` | OK                     | Successful GET, PUT, DELETE                                      |
| `201` | Created                | Successful POST (register, create field, create report, etc.)    |
| `400` | Bad Request            | Validation failure, missing required fields, wrong password      |
| `401` | Unauthorized           | No token provided or token expired/invalid                       |
| `403` | Forbidden              | Insufficient role (e.g., non-admin accessing admin routes), unverified email |
| `404` | Not Found              | Resource does not exist                                          |
| `409` | Conflict               | Duplicate email on register, or duplicate field detected (fuzzy) |
| `429` | Too Many Requests      | Rate limit exceeded                                              |
| `500` | Internal Server Error  | Unexpected server failure                                        |

---

## ⏱️ Rate Limiting

| Limiter            | Window    | Max Requests | Applied To                              |
|--------------------|-----------|--------------|------------------------------------------|
| `globalLimiter`    | 1 minute  | 300          | All routes                               |
| `authLimiter`      | 15 minutes| 10           | `/auth/register`, `/auth/login`, `/auth/resend-verification` |
| `submissionLimiter`| 1 hour    | 20           | `POST /fields`, `POST /reports`, `POST /upload` |

---

## 🔑 Environment Variables

| Variable              | Required | Description                                     | Example                                    |
|-----------------------|----------|-------------------------------------------------|--------------------------------------------|
| `DATABASE_URL`        | ✅       | PostgreSQL connection string                    | `postgresql://user:pass@host:5432/db`      |
| `PORT`                | Optional | Server port (default 5000)                      | `5000`                                     |
| `NODE_ENV`            | Optional | `development` or `production`                   | `development`                              |
| `JWT_SECRET`          | ✅       | Secret key for signing JWT tokens               | `your-random-64-char-hex-string`           |
| `JWT_EXPIRES_IN`      | Optional | Token lifespan (default `7d`)                   | `7d`                                       |
| `ALLOWED_ORIGINS`     | ✅       | Comma-separated frontend URLs for CORS          | `http://localhost:3000,https://example.com` |
| `SUPABASE_URL`        | ✅       | Supabase project URL                            | `https://xxxxx.supabase.co`                |
| `SUPABASE_ANON_KEY`   | ✅       | Supabase anonymous/public API key               | `eyJhbGciOi...`                            |
| `RESEND_API_KEY`      | ✅       | API key for Resend (email service)              | `re_xxxxxxxxx`                             |
| `FROM_EMAIL`          | ✅       | Verified sender email for transactional emails  | `noreply@comeplayapp.com`                  |
| `ADMIN_EMAIL`         | Optional | Admin seed email                                | `admin@comeplayapp.com`                    |
| `ADMIN_PASSWORD`      | Optional | Admin seed password                             | `SecureAdmin123`                           |
| `ADMIN_NAME`          | Optional | Admin seed full name                            | `Super Admin`                              |

---

## 🧪 Testing

### Health Check Script
```bash
node scripts/health_check.js
```
Outputs table counts for users, fields, reports, payouts, notifications, and role breakdowns.

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "fullName": "Test User",
    "role": "REPORTER"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**Get Profile (authenticated):**
```bash
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Submit Field (authenticated):**
```bash
curl -X POST http://localhost:5000/api/v1/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Field",
    "location": "Lagos, Nigeria",
    "surfaceType": "Natural Grass",
    "fieldSize": "11-a-side",
    "images": ["url1", "url2", "url3"]
  }'
```

**Admin: Get Dashboard Stats:**
```bash
curl -X GET http://localhost:5000/api/v1/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

**Admin: Verify Field:**
```bash
curl -X PUT http://localhost:5000/api/v1/admin/fields/FIELD_ID/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -d '{ "status": "APPROVED" }'
```

**Upload Image:**
```bash
curl -X POST http://localhost:5000/api/v1/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@/path/to/image.jpg"
```

---

> **Generated:** March 5, 2026  
> **Maintainer:** Report Come Play Development Team
