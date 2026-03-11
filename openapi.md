# Report Come Play - API Documentation

Comprehensive API documentation for the Report Come Play platform. 
This API handles user authentication, scouting report submissions, field management, and administrative payouts.

### Authentication
Most endpoints require a JWT Bearer token. 
To authenticate, use the `/auth/login` endpoint and include the returned token in the headers of subsequent requests:
`Authorization: Bearer <your_token>`

---

## Servers
- **Local Development Server**: `http://localhost:5000/api/v1`
- **Production Server**: `https://api.comeplayapp.com/api/v1`

---

## Content Overview
1. [Authentication](#authentication-endpoints)
2. [User Operations](#user-operations)
3. [Field Operations](#field-operations)
4. [Report Operations](#report-operations)
5. [Upload](#upload)
6. [Admin Operations](#admin-operations)

---

## Authentication Endpoints

### Register a new user
- **URL:** `/auth/register`
- **Method:** `POST`
- **Body:** `{ email, password, fullName, phoneNumber }`
- **Responses:** `201 Created`, `409 User already exists`

### Login user
- **URL:** `/auth/login`
- **Method:** `POST`
- **Body:** `{ email, password }`
- **Responses:** `200 Successful` (Returns Bearer token and User object)

### Verify user email
- **URL:** `/auth/verify-email`
- **Method:** `POST`
- **Body:** `{ email, code }`
- **Responses:** `200 Email verified`

### Resend email verification code
- **URL:** `/auth/resend-verification`
- **Method:** `POST`
- **Body:** `{ email }`
- **Responses:** `200 Code resent`

### Request password reset code
- **URL:** `/auth/forgot-password`
- **Method:** `POST`
- **Body:** `{ email }`
- **Responses:** `200 Reset code sent`

### Reset password
- **URL:** `/auth/reset-password`
- **Method:** `POST`
- **Body:** `{ email, code, newPassword }`
- **Responses:** `200 Password updated`

### Get current profile
- **URL:** `/auth/me`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 User data`

---

## User Operations

### Get full user profile
- **URL:** `/users/profile`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 Profile data`

### Update profile info or bank details
- **URL:** `/users/profile`
- **Method:** `PUT`
- **Authentication:** Bearer Token
- **Body:** `{ fullName, phoneNumber, avatar, bankName, accountNumber, accountName }`
- **Responses:** `200 Updated`

### Change password
- **URL:** `/users/change-password`
- **Method:** `PUT`
- **Authentication:** Bearer Token
- **Body:** `{ currentPassword, newPassword }`
- **Responses:** `200 Changed`

### Get user reports
- **URL:** `/users/reports`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 List of reports`

### Get payout history
- **URL:** `/users/payouts`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 List of payouts`

### Get single payout details
- **URL:** `/users/payouts/{id}`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 Payout data`

### Get user notifications
- **URL:** `/users/notifications`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 Notifications list`

### Mark all notifications read
- **URL:** `/users/notifications/read-all`
- **Method:** `PUT`
- **Authentication:** Bearer Token
- **Responses:** `200 Success`

### Mark specific notification read
- **URL:** `/users/notifications/{id}/read`
- **Method:** `PUT`
- **Authentication:** Bearer Token
- **Responses:** `200 Success`

---

## Field Operations

### List all stadiums/fields
- **URL:** `/fields`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 List of fields`

### Submit a new stadium field
- **URL:** `/fields`
- **Method:** `POST`
- **Authentication:** Bearer Token
- **Body:** `{ name, location, description, images }`
- **Responses:** `201 Created`

### Get details of a specific field
- **URL:** `/fields/{id}`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 Field details`

### Update field information
- **URL:** `/fields/{id}`
- **Method:** `PUT`
- **Authentication:** Bearer Token
- **Body:** Field Object
- **Responses:** `200 Updated`

### Delete a field
- **URL:** `/fields/{id}`
- **Method:** `DELETE`
- **Authentication:** Bearer Token
- **Responses:** `200 Deleted`

---

## Report Operations

### Get all reports
- **URL:** `/reports`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 List`

### Post a scouting intelligence report
- **URL:** `/reports`
- **Method:** `POST`
- **Authentication:** Bearer Token
- **Body:** `{ content, fieldId }`
- **Responses:** `201 Submitted`

### Get single report detail
- **URL:** `/reports/{id}`
- **Method:** `GET`
- **Authentication:** Bearer Token
- **Responses:** `200 Report data`

### Update report
- **URL:** `/reports/{id}`
- **Method:** `PUT`
- **Authentication:** Bearer Token
- **Responses:** `200 Updated`

### Delete report
- **URL:** `/reports/{id}`
- **Method:** `DELETE`
- **Authentication:** Bearer Token
- **Responses:** `200 Deleted`

---

## Upload

### Single image upload to R2
- **URL:** `/upload`
- **Method:** `POST`
- **Authentication:** Bearer Token
- **Body:** `Multipart Form-Data (image)`
- **Responses:** `200 JSON with public URL`

---

## Admin Operations

### Get system-wide statistics
- **URL:** `/admin/stats`
- **Method:** `GET`
- **Authentication:** Bearer Token (ADMIN only)
- **Responses:** `200 Analytics data`

### List all platform users
- **URL:** `/admin/users`
- **Method:** `GET`
- **Authentication:** Bearer Token (ADMIN only)
- **Responses:** `200 Users list`

### Get user details
- **URL:** `/admin/users/{id}`
- **Method:** `GET`
- **Authentication:** Bearer Token (ADMIN only)
- **Responses:** `200 User data`

### Remove user account
- **URL:** `/admin/users/{id}`
- **Method:** `DELETE`
- **Authentication:** Bearer Token (ADMIN only)
- **Responses:** `200 Success`

### Verify/Approve a stadium submission
- **URL:** `/admin/fields/{id}/verify`
- **Method:** `PUT`
- **Authentication:** Bearer Token (ADMIN only)
- **Body:** `{ status: "APPROVED" | "REJECTED" }`
- **Responses:** `200 Updated`

### List all system payouts
- **URL:** `/admin/payouts`
- **Method:** `GET`
- **Authentication:** Bearer Token (ADMIN only)
- **Responses:** `200 Payouts list`

### Disburse a reward to a user
- **URL:** `/admin/payouts`
- **Method:** `POST`
- **Authentication:** Bearer Token (ADMIN only)
- **Body:** `{ userId, amount, receiptUrl }`
- **Responses:** `201 Payout initialized`

### Update payout status or proof
- **URL:** `/admin/payouts/{id}`
- **Method:** `PUT`
- **Authentication:** Bearer Token (ADMIN only)
- **Responses:** `200 Updated`

---

## Data Models (Schemas)

### User
```typescript
{
  id: string,
  email: string,
  fullName: string,
  role: "REPORTER" | "OWNER" | "ADMIN",
  phoneNumber: string,
  avatar: string,
  emailVerified: boolean,
  bankName: string,
  accountNumber: string,
  accountName: string
}
```

### Field
```typescript
{
  id: string,
  name: string,
  location: string,
  description: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  surfaceType: string,
  fieldSize: string,
  ownerId: string,
  images: string[]
}
```

### Report
```typescript
{
  id: string,
  content: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  userId: string,
  fieldId: string,
  createdAt: date-time
}
```

### Payout
```typescript
{
  id: string,
  userId: string,
  amount: number,
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
  processedAt: date-time,
  receiptUrl: string,
  createdAt: date-time
}
```
