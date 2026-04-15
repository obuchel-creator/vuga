# Vuga Backend

Node.js + Express REST API with PostgreSQL, JWT authentication, and WebSocket real-time updates.

## Environment Variables

| Variable        | Required | Default                              | Description                                |
|-----------------|----------|--------------------------------------|--------------------------------------------|
| `DATABASE_URL`  | Yes      | —                                    | PostgreSQL connection string               |
| `JWT_SECRET`    | Yes      | `dev_secret_change_in_production`    | Secret key for signing JWTs (change this!) |
| `JWT_EXPIRES_IN`| No       | `7d`                                 | JWT expiry (e.g. `1d`, `7d`, `30d`)        |
| `PORT`          | No       | `5000`                               | Port the HTTP + WebSocket server listens on|
| `CORS_ORIGIN`   | No       | `*`                                  | Allowed CORS origin (lock in production)   |

Create a `.env` file in `backend/` for local development:

```
DATABASE_URL=postgres://user:password@localhost:5432/vuga
JWT_SECRET=changeme
JWT_EXPIRES_IN=7d
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

## Database Setup

Run the schema against your PostgreSQL database:

```bash
psql $DATABASE_URL -f schema.sql
```

## Install & Start

```bash
npm install
npm start
```

The server exposes both the REST API and WebSocket connections on the same port.

## WebSocket Events

Connect to `ws://<host>:<port>` — the server broadcasts:

| Event                   | Payload                                        | When                     |
|-------------------------|------------------------------------------------|--------------------------|
| `report:new`            | Full report object                             | A new report is created  |
| `report:votesUpdated`   | `{ id, upvotes, downvotes }`                   | A report is up/downvoted |
| `comment:new`           | `{ report_id, comment }`                       | A comment is posted      |

## API Endpoints

### Public

| Method | Path                        | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/api/reports`              | List all traffic reports       |
| GET    | `/api/reports/:id/comments` | Get comments for a report      |
| POST   | `/api/auth/register`        | Register (email/phone+password)|
| POST   | `/api/auth/login`           | Login → returns `{ token, user }` |
| POST   | `/api/route-suggestions`    | Placeholder route suggestion   |

### Authenticated (JWT Bearer token required)

| Method | Path                          | Description                           |
|--------|-------------------------------|---------------------------------------|
| POST   | `/api/reports`                | Create a traffic report (+ photo)     |
| POST   | `/api/reports/:id/upvote`     | Upvote a report                       |
| POST   | `/api/reports/:id/downvote`   | Downvote a report                     |
| POST   | `/api/reports/:id/comments`   | Add a comment to a report             |
| POST   | `/api/push/register`          | Register Expo push token              |

### Admin / Moderator only

| Method | Path                  | Roles              | Description                    |
|--------|-----------------------|--------------------|--------------------------------|
| POST   | `/api/push/send`      | admin, moderator   | Send push to userIds or role   |
| POST   | `/api/admin/broadcast`| admin              | Broadcast push to all users    |

## Running Tests

```bash
npm test
```
