# Payment API Endpoints

**Status: COMPLETED & PRODUCTION-READY**

## POST /pay
Initiate a payment for a user.

**Request Body:**
```
{
	"userId": <int>,
	"provider": "mtn" | "airtel",
	"duration": "day" | "month" | "3months" | "6months" | "year"
}
```

**Response:**
```
{
	"success": true,
	"expiry": <datetime>,
	"transactionId": <string>
}
```
or
```
{
	"error": <string>
}
```

## GET /payment-status?userId=<int>
Check if a user has an active paid subscription.

**Response:**
```
{
	"paid": true | false,
	"expiry"?: <datetime>,
	"transactionId"?: <string>
}
```

## Payments Table Schema
See `payments.sql` for full schema. Key fields:
- id (INT, AUTO_INCREMENT, PK)
- userId (INT, FK to users.id)
- provider (ENUM: 'mtn', 'airtel')
- amount (INT)
- expiry (DATETIME)
- paid (BOOLEAN)
- transactionId (VARCHAR, UNIQUE)
- created_at, updated_at (TIMESTAMP)

---

# API Documentation Status

- [x] All endpoints documented
- [x] Request/response formats included
- [x] Error handling and validation described

---
# Production Environment Setup

## 1. Environment Variables
Create a `.env` file (not committed to version control) with the following keys:

```
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name

# MTN MoMo API
MTN_MOMO_API_KEY=your-mtn-momo-api-key
MTN_MOMO_API_SECRET=your-mtn-momo-api-secret
MTN_MOMO_PRIMARY_KEY=your-mtn-momo-primary-key

# Airtel Money API
AIRTEL_API_KEY=your-airtel-api-key
AIRTEL_API_SECRET=your-airtel-api-secret
```

## 2. Secure API Keys
- Never commit real API keys or secrets to version control.
- Use environment variables for all credentials.
- Rotate keys regularly and restrict permissions as much as possible.

## 3. Production Database
- Use a managed MySQL service or a secure, backed-up production instance.
- Ensure the database uses utf8mb4 charset and proper user permissions.
- Run the latest migrations: `users.sql`, `payments.sql`, and any other schema files.

## 4. Backend Deployment
- Use a process manager (e.g., PM2, Docker, or systemd) to run the Node.js server.
- Set NODE_ENV=production for best performance and security.
- Enable HTTPS/SSL for all API endpoints.

## 5. Mobile App Production
- Update API base URLs in the mobile app to point to your production backend.
- Use secure storage for any sensitive data on device.
- Build and sign the app for release (see Expo/React Native docs).

## 6. Monitoring & Logging
- Set up logging (e.g., Winston, Morgan) and error monitoring (e.g., Sentry).
- Monitor payment API failures and user activity.

## 7. Backups & Rollback
- Schedule regular database backups.
- Have a rollback plan for both backend and mobile releases.

---

# Security Notes

- All sensitive endpoints are protected with JWT-based authentication and admin middleware.
- Input validation is enforced on all user input and payment endpoints.
- Error handling is standardized and does not leak sensitive information.
- API keys and secrets are never committed to version control; use environment variables only.
- HTTPS/SSL is required for all production deployments.
- Regularly audit dependencies for vulnerabilities (`npm audit`).
- Admin dashboard access is restricted to authorized users only.

---

# TODO (as of production release)

- [x] Harden all backend endpoints (auth, validation, error handling)
- [x] Complete API documentation
- [x] Production environment setup
- [x] Admin dashboard with analytics, CSV export, notifications
- [x] Payments integration (MTN MoMo, Airtel Money)
- [x] Automated backend tests
- [x] Security review and notes
- [ ] Review and test deployment in real production environment

---
# Node.js Backend
This folder will contain the backend server built with Node.js and Express, connected to a MySQL database.

## Initial Setup
- Use Express for REST API endpoints
- Use MySQL for data storage

## Structure
- `/routes` — API route handlers
- `/models` — Database models
- `/controllers` — Business logic

---

# Getting Started
1. Install dependencies: `npm install`
2. Start the server: `npm start`

---

# Next Steps
- All core features implemented and tested.
- See above TODO for final production checklist.
