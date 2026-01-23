# Report Come Play - Backend API

A RESTful API built with Node.js, Express, Prisma, and PostgreSQL for the field reporting platform.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Role-Based Access Control**: Reporter, Owner, and Admin roles
- **Field Management**: Owners can create and manage fields
- **Report System**: Users can submit reports on fields
- **Payout Management**: Admin can manage payouts with receipt uploads
- **PostgreSQL Database**: Powered by Prisma ORM

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── database.js        # Prisma client configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── report.controller.js
│   │   ├── field.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── roleCheck.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── report.routes.js
│   │   ├── field.routes.js
│   │   └── admin.routes.js
│   ├── utils/
│   │   ├── jwt.util.js
│   │   └── password.util.js
│   └── server.js              # Express app entry point
├── .env                        # Environment variables (create from .env.example)
├── .env.example                # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**Option A: Using Supabase (Recommended for beginners)**

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the database to be provisioned (~1 minute)
4. Go to **Settings** → **Database**
5. Copy the **Connection String** (URI format)
6. It will look like: `postgresql://postgres.xxxxx:password@xxx.supabase.co:5432/postgres`

**Option B: Using Local PostgreSQL**

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a new database:
   ```bash
   createdb report_come_play
   ```
3. Your connection string: `postgresql://postgres:password@localhost:5432/report_come_play`

### 3. Configure Environment Variables

Create a `.env` file in the backend folder:

```bash
cp .env.example .env
```

Edit `.env` and add your database connection string:

```env
# Database (from Supabase or local PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Server
PORT=5000
NODE_ENV=development

# JWT (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS (your frontend URL)
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Run Database Migrations

This will create all tables in your database:

```bash
npm run prisma:migrate
```

When prompted, give your migration a name like: `init`

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════╗
║   🚀 Server Running Successfully!         ║
╠═══════════════════════════════════════════╣
║   Port: 5000                              ║
║   Environment: development                ║
║   API: http://localhost:5000/api          ║
╚═══════════════════════════════════════════╝
```

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/verify-email` | Verify email | No |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update profile | Yes |
| GET | `/api/users/reports` | Get user's reports | Yes |
| GET | `/api/users/payouts` | Get user's payouts | Yes |

### Reports (`/api/reports`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/reports` | List all reports | Yes | All |
| GET | `/api/reports/:id` | Get single report | Yes | All |
| POST | `/api/reports` | Create report | Yes | All |
| PUT | `/api/reports/:id` | Update report | Yes | Owner/Admin |
| DELETE | `/api/reports/:id` | Delete report | Yes | Owner/Admin |

### Fields (`/api/fields`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/fields` | List all fields | Yes | All |
| GET | `/api/fields/:id` | Get single field | Yes | All |
| POST | `/api/fields` | Create field | Yes | Owner/Admin |
| PUT | `/api/fields/:id` | Update field | Yes | Owner/Admin |
| DELETE | `/api/fields/:id` | Delete field | Yes | Owner/Admin |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/admin/users` | List all users | Yes | Admin |
| GET | `/api/admin/payouts` | List payouts | Yes | Admin |
| POST | `/api/admin/payouts` | Create payout | Yes | Admin |
| PUT | `/api/admin/payouts/:id` | Update payout | Yes | Admin |
| GET | `/api/admin/stats` | Dashboard stats | Yes | Admin |

## 🔐 Authentication

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example Register Request:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "role": "REPORTER",
  "phoneNumber": "+1234567890"
}
```

**Example Login Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "REPORTER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 🗄️ Database Models

### User
- id, email, password, fullName, role, phoneNumber, emailVerified
- Roles: `REPORTER`, `OWNER`, `ADMIN`

### Field
- id, name, location, description, ownerId
- Owned by users with `OWNER` or `ADMIN` role

### Report
- id, content, status, userId, fieldId
- Status: `PENDING`, `APPROVED`, `REJECTED`

### Payout
- id, userId, amount, status, receiptUrl, processedAt
- Status: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

### Admin
- id, userId, permissions

## 🔧 Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 🧪 Testing the API

You can test the API using:
- **Postman**: Import the endpoints
- **Thunder Client** (VS Code extension)
- **cURL**:

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "fullName": "Test User",
    "role": "REPORTER"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

## 🌐 CORS Configuration

By default, CORS is configured to allow requests from `http://localhost:3000`.

To allow multiple origins, update your `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `JWT_SECRET` | Secret key for JWT | Random secure string |
| `JWT_EXPIRES_IN` | Token expiration | `7d`, `24h`, etc. |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

## 🚨 Troubleshooting

**Database connection error:**
- Verify your `DATABASE_URL` is correct
- Check if database is running (for local PostgreSQL)
- For Supabase, ensure project is not paused

**Prisma Client error:**
- Run `npm run prisma:generate`
- Ensure migrations are up to date: `npm run prisma:migrate`

**Port already in use:**
- Change `PORT` in `.env` file
- Or kill the process using port 5000

## 📦 Dependencies

- **express**: Web framework
- **@prisma/client**: Database ORM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **cors**: CORS middleware
- **dotenv**: Environment variables
- **express-validator**: Input validation

## 📄 License

MIT

## 👨‍💻 Author

Created for the Report Come Play platform
