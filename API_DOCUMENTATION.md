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

All of these use **GET** and require **Authentication (`Bearer Token`)**.

- **Get Own Reports:** `/users/reports?page=1&limit=10`
- **Get Own Payouts:** `/users/payouts`
- **Get Specific Payout Detail:** `/users/payouts/:id`
- **Get Own Notifications:** `/users/notifications`
- **Mark Notification Read:** `PUT /users/notifications/:id/read`
- **Mark All Notifications Read:** `PUT /users/notifications/read-all`

*(Reports and Payouts return formatted paginated arrays)*

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
- **Update Field**: `PUT /fields/:id` (Provides exactly the same body as POST. Requires being the field's original creator.)
- **Delete Field**: `DELETE /fields/:id`

---

# 4. Report Operations

### 4.1 Post a Scouting Report
Submit intelligence on an existing field.

- **URL**: `/reports`
- **Method**: `POST`
- **Authentication Required**: Yes (`Bearer Token`)

**Request Payload:**
```json
{
  "content": "The pitch requires maintenance. The artificial grass is wearing off in the penalty box.",
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

### 6.1 Admin: Platform Users
- **List Users**: `GET /admin/users?role=REPORTER&page=1&limit=20`
- **Get Specific User**: `GET /admin/users/:id`
- **Delete User**: `DELETE /admin/users/:id` (Permanent termination)

### 6.2 Admin: Analytics Details
Calculates top reporters, recent activity, and graphical 7-day stats.
- **URL**: `GET /admin/stats`

### 6.3 Admin: Payout Distributions
Initialize and issue system payout status signals.

- **List All Payouts**: `GET /admin/payouts?status=PENDING&page=1`
- **Create a Payout Request (POST /admin/payouts)**: 
```json
{
  "userId": "cln123",
  "amount": 50000,
  "status": "COMPLETED",
  "receiptUrl": "url_to_proof"
}
```
- **Update a Payout (PUT /admin/payouts/:id)**:
```json
{
  "status": "COMPLETED",
  "receiptUrl": "url_to_proof"
}
```

### 6.4 Admin: Verify Field Submission Details
Approve or reject a submitted stadium.

- **URL**: `PUT /admin/fields/:id/verify`
- **Body**: `{ "status": "APPROVED" }` (or `"REJECTED"`)
