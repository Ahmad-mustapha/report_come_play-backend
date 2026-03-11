# Report Come Play - Comprehensive API Documentation

Welcome to the official API documentation for the **Report Come Play** platform. This API enables user authentication, profile management, field submissions, scouting reports, and admin payouts.

## 🔗 Base URLs
All API requests must be prefixed with one of the following base URLs:

- **Production Server**: `https://api.comeplayapp.com/api/v1`
- **Local Development Server**: `http://localhost:5000/api/v1`

---

## 🛡️ Authentication
Most endpoints in this API require authentication using a **JSON Web Token (JWT)**. 
When an endpoint requires authentication, you must include the token in the `Authorization` header of your HTTP request.

**Header Format:**
```http
Authorization: Bearer <your_jwt_token_here>
```

---

## ❌ Common Standard Responses
To keep the documentation clean, these standard error responses apply to most endpoints unless specified otherwise:

- **`400 Bad Request`**: The request body is malformed or missing required fields.
- **`401 Unauthorized`**: You are not authenticated. The Bearer token is missing, invalid, or expired.
- **`403 Forbidden`**: You are authenticated but do not have the required role, or email verification is required.
- **`404 Not Found`**: The requested resource does not exist.
- **`409 Conflict`**: Resource already exists (e.g., email already registered or exact field already reported).
- **`429 Too Many Requests`**: Rate limiting exceeded (e.g. asking for verification resends too quickly).
- **`500 Internal Server Error`**: An unexpected error occurred on the server.

Example Error Response Body:
```json
{
  "success": false,
  "message": "A human-readable error message explaining what went wrong"
}
```

---

# 1. Authentication Endpoints

### 1.1 Register a New User
Creates a new user account. On success, an email containing a 6-digit verification code will be sent to the user.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Authentication Required**: No

**Request Payload:**
```json
{
  "email": "johndoe@example.com",
  "password": "strongpassword123",
  "fullName": "John Doe",
  "phoneNumber": "+2348000000000",
  "role": "REPORTER" 
}
```
*Notes:* 
- *`password` must be at least 6 characters and contain at least one number.*
- *`role` is optional but accepted (must be either 'REPORTER' or 'OWNER'). Defaults to REPORTER.*
- *`phoneNumber` is optional.*

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for the verification code.",
  "data": {
    "user": {
      "id": "cln123456789",
      "email": "johndoe@example.com",
      "fullName": "John Doe",
      "role": "REPORTER",
      "emailVerified": false,
      "createdAt": "2023-10-12T10:00:00Z"
    },
    "token": "eyJhb..."
  }
}
```

---

### 1.2 Login User
Authenticates a user and returns a token. 

- **URL**: `/auth/login`
- **Method**: `POST`
- **Authentication Required**: No

**Request Payload:**
```json
{
  "email": "johndoe@example.com",
  "password": "strongpassword123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "cln123456789",
      "email": "johndoe@example.com",
      "fullName": "John Doe",
      "role": "REPORTER",
      "emailVerified": true
    },
    "token": "eyJhb..."
  }
}
```

**Error Note (Unverified Email):**
If the user's email is unverified, the login is rejected with a `403` status:
```json
{
  "success": false,
  "message": "Email not verified. Please check your email for the verification code.",
  "needsVerification": true,
  "userId": "cln123456789",
  "email": "johndoe@example.com"
}
```

---

### 1.3 Verify Email
Verifies a user's email address using a 6-digit code.

- **URL**: `/auth/verify-email`
- **Method**: `POST`
- **Authentication Required**: No

**Request Payload:**
```json
{
  "email": "johndoe@example.com",
  "code": "123456"
}
```
*(Alternatively, you can provide `"userId"` instead of `"email"`)*

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

---

### 1.4 Resend Verification Code
Requests a new 6-digit email verification code. Rate limited to once per 60 seconds.

- **URL**: `/auth/resend-verification`
- **Method**: `POST`
- **Authentication Required**: No

**Request Payload:**
```json
{
  "email": "johndoe@example.com"
}
```
*(Alternatively, you can provide `"userId"`)*

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification code resent successfully.",
  "expiresIn": 900
}
```

---

### 1.5 Get Current Profile (Me)
Fetches the profile details of the currently authenticated user.

- **URL**: `/auth/me`
- **Method**: `GET`
- **Authentication Required**: Yes (`Bearer Token`)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cln123456789",
      "email": "johndoe@example.com",
      "fullName": "John Doe",
      "role": "REPORTER",
      "phoneNumber": "+2348000000000",
      "emailVerified": true,
      "createdAt": "2023-10-12T10:00:00Z",
      "updatedAt": "2023-10-12T10:00:00Z"
    }
  }
}
```

---

# 2. User Operations

### 2.1 Update User Profile
Updates personal or banking info. To update password here, provide `currentPassword` and `newPassword`.

- **URL**: `/users/profile`
- **Method**: `PUT`
- **Authentication Required**: Yes (`Bearer Token`)

**Request Payload (All fields optional):**
```json
{
  "fullName": "John Doe Updated",
  "phoneNumber": "+2348011111111",
  "avatar": "https://r2.dev/avatars/new_john.jpg",
  "bankName": "First Bank",
  "accountNumber": "9876543210",
  "accountName": "John Doe Updated",
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": { "user": { /* ... */ } }
}
```

---

### 2.2 Change Password
Alternative dedicated endpoint for password changes.

- **URL**: `/users/change-password`
- **Method**: `PUT`
- **Authentication Required**: Yes (`Bearer Token`)

**Request Payload:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

---

### 2.3 Get User's Content (Reports, Payouts, Notifications)

All of these endpoints require **Authentication (`Bearer Token`)**.

#### Get Own Reports
- **URL**: `/users/reports?page=1&limit=10`
- **Method**: `GET`
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reports": [ /* Array of Report Objects */ ],
    "pagination": { "total": 1, "page": 1, "limit": 10, "pages": 1 }
  }
}
```

#### Get Own Payouts
- **URL**: `/users/payouts`
- **Method**: `GET`
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payouts": [ /* Array of Payout Objects */ ]
  }
}
```

#### Get Specific Payout Detail
- **URL**: `/users/payouts/{id}`
- **Method**: `GET`
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payout": { /* Extended Payout Object Data */ }
  }
}
```

#### Get Own Notifications
- **URL**: `/users/notifications`
- **Method**: `GET`
**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [ /* Array of Notification Objects */ ]
  }
}
```

#### Mark Notification Read
- **URL**: `/users/notifications/{id}/read`
- **Method**: `PUT`
**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read."
}
```

#### Mark All Notifications Read
- **URL**: `/users/notifications/read-all`
- **Method**: `PUT`
**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

---

# 3. Field (Stadium) Operations

### 3.1 List All Fields
Retrieves fields. Non-admin users will ONLY be returned fields they personally created/own.

- **URL**: `/fields`
- **Method**: `GET`
- **Authentication Required**: Yes (`Bearer Token`)
- **Query Params (Optional)**: `?page=1&limit=10&status=APPROVED`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "fields": [ /* Array of Field Objects */ ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

### 3.2 Submit a New Field
Only users with a `REPORTER` or `OWNER` role can submit. Will verify fuzzy deduplication to ensure the same field hasn't been submitted before.

- **URL**: `/fields`
- **Method**: `POST`
- **Authentication Required**: Yes (`Bearer Token`, min role: `REPORTER`)

**Request Payload:**
```json
{
  "name": "Legacy Pitch",
  "location": "Surulere, Lagos",
  "description": "Standard 11-a-side pitch",
  "surfaceType": "Artificial Grass",
  "fieldSize": "11v11",
  "availability": "Mon-Sun, 8AM to 10PM",
  "contactInfo": "08012345678",
  "access": "Public, Pay per hour",
  "managerName": "Tunde",
  "managerContact": "08087654321",
  "latitude": 6.4950,
  "longitude": 3.3591,
  "images": [
    "https://r2.dev/img1.jpg",
    "https://r2.dev/img2.jpg",
    "https://r2.dev/img3.jpg"
  ]
}
```
*Note: `name` and `location` are strictly required. You MUST provide exactly `3` image strings inside the `images` array.*

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Field created successfully.",
  "data": { "field": { /* ... */ } }
}
```

**Conflict Alert Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Duplicate Alert! It looks like this field has already been reported as 'Legacy Pitch' at 'Surulere, Lagos'. No need to submit it again!"
}
```

---

### 3.3 Update or Delete Field

#### Update Field
- **URL**: `/fields/{id}`
- **Method**: `PUT`
- **Authentication Required**: Yes (`Bearer Token`, must be the original creator or ADMIN)

**Request Payload (All fields optional):**
```json
{
  "name": "Updated Legacy Pitch",
  "location": "New Surulere, Lagos",
  "description": "Updated descriptions here",
  "surfaceType": "Natural Grass",
  "fieldSize": "7v7",
  "managerName": "John Wick",
  "images": [
    "https://r2.dev/img1-new.jpg",
    "https://r2.dev/img2.jpg",
    "https://r2.dev/img3.jpg"
  ]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Field updated successfully.",
  "data": { "field": { /* Updated Field Object */ } }
}
```

#### Delete Field
- **URL**: `/fields/{id}`
- **Method**: `DELETE`
- **Authentication Required**: Yes (`Bearer Token`, must be the original creator or ADMIN)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Field deleted successfully."
}
```

---

# 4. Report Operations

### 4.1 Get All Reports
Retrieves a paginated list of scouting reports.
- **URL**: `/reports`
- **Method**: `GET`
- **Authentication Required**: Yes (`Bearer Token`)
- **Query Params (Optional)**: `?page=1&limit=10&status=PENDING&fieldId={id}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reports": [ /* Array of Report Objects */ ],
    "pagination": { "total": 1, "page": 1, "limit": 10, "pages": 1 }
  }
}
```

### 4.2 Get Specific Report
Fetches details of a single report.
- **URL**: `/reports/{id}`
- **Method**: `GET`
- **Authentication Required**: Yes (`Bearer Token`)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": { "report": { /* Report Object */ } }
}
```

### 4.3 Post a Scouting Report
Submit intelligence on an existing field.
- **URL**: `/reports`
- **Method**: `POST`
- **Authentication Required**: Yes (`Bearer Token`)

**Request Payload:**
```json
{
  "content": "The pitch requires maintenance. The artificial grass is wearing off.",
  "fieldId": "fld123456"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Report created successfully.",
  "data": { "report": { /* ... */ } }
}
```

### 4.4 Update a Report
Allows the original reporter (or an Admin) to update the content of a report. Admins: passing `status` will update the approval status.
- **URL**: `/reports/{id}`
- **Method**: `PUT`
- **Authentication Required**: Yes (`Bearer Token`)

**Request Payload:**
```json
{
  "content": "Updated report documentation here.",
  "status": "APPROVED" 
}
```
*(Note: `status` is only processed if the user is an ADMIN)*

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Report updated successfully.",
  "data": { "report": { /* Updated Report Object */ } }
}
```

### 4.5 Delete a Report
Deletes a specific report.
- **URL**: `/reports/{id}`
- **Method**: `DELETE`
- **Authentication Required**: Yes (`Bearer Token`, must be the original creator or ADMIN)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Report deleted successfully."
}
```

---

# 5. File Upload

### Single Image Upload to R2 Bucket
Returns a direct public URL to save down and push in subsequent payloads (like field images or avatar).

- **URL**: `/upload`
- **Method**: `POST`
- **Authentication Required**: Yes (`Bearer Token`)
- **Headers**: `Content-Type: multipart/form-data`

**Body**: 
A form field with the key `image` containing the actual binary file.

**Success Response (200 OK):**
```json
{
  "url": "https://pub-yourbucketr2.r2.dev/filename-12345.jpg"
}
```

*(Note: Returns direct URL, not wrapped in `success: true`)*

---

# 6. Admin Operations 
*(Requires `ADMIN` Role)*

### 6.1 List Platform Users
Retrieves a paginated list of users.
- **URL**: `/admin/users`
- **Method**: `GET`
- **Query Params (Optional)**: `?role=REPORTER&page=1&limit=20`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [ /* Array of User Objects */ ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

### 6.2 Get Specific User
Fetches comprehensive details of a specific user.
- **URL**: `/admin/users/{id}`
- **Method**: `GET`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Detailed User Object */ }
}
```

### 6.3 Delete User
Permanently terminates a user account (Administrators cannot be deleted).
- **URL**: `/admin/users/{id}`
- **Method**: `DELETE`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User access has been permanently terminated."
}
```

### 6.4 Get System Statistics (Analytics)
Fetches high-level metrics for dashboard graphs and totals.
- **URL**: `/admin/stats`
- **Method**: `GET`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": { /* users, fields, reports, payouts counts */ },
    "charts": [ /* Activity for last 7 days */ ],
    "recentActivity": [ /* Recently submitted fields */ ],
    "topReporters": [ /* Top active users */ ]
  }
}
```

### 6.5 List All System Payouts
Fetches all payout records across the system.
- **URL**: `/admin/payouts`
- **Method**: `GET`
- **Query Params (Optional)**: `?status=PENDING&userId={id}&page=1&limit=20`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payouts": [ /* Array of Payout Objects */ ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

### 6.6 Create a Payout
Initializes a new payout record.
- **URL**: `/admin/payouts`
- **Method**: `POST`

**Request Payload:**
```json
{
  "userId": "cln123456789",
  "amount": 50000,
  "status": "COMPLETED",
  "receiptUrl": "https://r2.dev/receipts/proof123.jpg"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Payout created successfully.",
  "data": { "payout": { /* ... */ } }
}
```

### 6.7 Update a Payout
Updates the status or receipt of an existing payout.
- **URL**: `/admin/payouts/{id}`
- **Method**: `PUT`

**Request Payload:**
```json
{
  "status": "COMPLETED",
  "receiptUrl": "https://r2.dev/receipts/proof123.jpg"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Payout updated successfully.",
  "data": { "payout": { /* ... */ } }
}
```

### 6.8 Verify Field Submission
Updates the verification status of a submitted field (e.g. APPROVED or REJECTED).
- **URL**: `/admin/fields/{id}/verify`
- **Method**: `PUT`

**Request Payload:**
```json
{
  "status": "APPROVED" 
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Field approved successfully.",
  "data": { "field": { /* ... */ } }
}
```
