
# ReachInbox — Email Scheduling & Campaign Management Platform

A full-stack SaaS application for creating, scheduling, and managing email campaigns with background processing, multiple senders, and email search.

## Demo & Screenshots

### Dashboard
![Dashboard](./docs/screenshots/dashboard.png)

### Campaign Management
![Campaigns](./docs/screenshots/campaigns.png)

### Email Preview
![Email Preview](./docs/screenshots/emails.png)

### Slack 
![Slack](./docs/screenshots/slack.png)

![Slack](./docs/screenshots/slack_oauth.png)


### Received Email (Ethereal)
![Received Email](./docs/screenshots/email.png)

### Demo Video

[Watch ReachInbox Demo](./docs/video/Screen Recording 2026-11-03 032135 (compressed by happyscribe.com).mp4)

---

## Features

- Create and manage email campaigns.
- Schedule emails for future delivery.
- Bulk email processing using BullMQ and Redis.
- Multiple sender account management.
- Upload leads through CSV and TXT files.
- Google OAuth authentication.
- Slack integration and test notifications.
- Email search powered by Elasticsearch.
- Track Scheduled, Processing, Sent, and Failed statuses.
- Automatic job retries.
- Background queue monitoring using Bull Board.
- Email rate limiting and concurrency management.

## Tech Stack

**Frontend**
- React, TypeScript, Vite
- Tailwind CSS, shadcn/ui
- React Router, TanStack Query
- Axios, Lucide React

**Backend**
- Node.js, Express.js, TypeScript
- PostgreSQL, Prisma ORM
- Redis, BullMQ
- Nodemailer, Elasticsearch
- Google OAuth 2.0
- Slack API / OAuth
- Bull Board

## Architecture

```text
React Frontend
      |
      v
Express REST API
      |
      +---------- PostgreSQL
      |
      +---------- Redis
      |              |
      |              v
      |          BullMQ Queue
      |              |
      |              v
      |          Email Worker
      |              |
      |              v
      |          Nodemailer
      |              |
      |              v
      |          Ethereal SMTP
      |
      +---------- Elasticsearch
```

## Project Structure

```text
outbox_project/
├── backend/
│   ├── prisma/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── queues/
│       ├── routes/
│       ├── services/
│       ├── workers/
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── lib/
│       └── main.tsx
│
├── docs/
│   ├── screenshots/
│   └── demo/
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL
- Redis
- Elasticsearch

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/ReachInbox.git
cd ReachInbox
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/reachinbox"

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

ELASTICSEARCH_NODE=https://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_CA_CERT=C:/path/to/http_ca.crt

TOKEN_ENCRYPTION_KEY=your_encryption_key
```

Configure all additional environment variables required by your application.

Run database migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start backend:

```bash
npm run dev
```

Backend: `http://localhost:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

### 4. Start Supporting Services

Ensure PostgreSQL, Redis, and Elasticsearch are running before starting the backend and processing campaigns.

## Email Testing

The application currently uses Ethereal Email with Nodemailer for SMTP testing.

Ethereal captures outgoing test emails and generates preview URLs to inspect:

- Recipient address
- Subject
- Email body
- Message headers

**Note:** Ethereal is a testing SMTP service. Emails are captured for preview and are not delivered to real recipient inboxes. A production SMTP provider is required for actual email delivery.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/google` | Google authentication |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/campaigns` | Get campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/emails` | Get emails |
| GET | `/api/emails/stats` | Email statistics |
| GET | `/api/search` | Search emails |
| GET | `/api/senders` | Get sender accounts |
| POST | `/api/slack/connect` | Connect Slack |
| GET | `/api/slack/status` | Slack connection status |

Protected endpoints require a valid Bearer token.

## Future Improvements

- Production SMTP integration.
- Advanced campaign analytics.
- Email delivery and bounce tracking.
- Campaign pause and resume.
- Enhanced scheduling and sender-level throttling.
- Automated testing and deployment.

## Author

**Himanshu Chehal**

M.E. Artificial Intelligence  
Thapar Institute of Engineering & Technology

[GitHub](https://github.com/YOUR_USERNAME)

---

Built as a full-stack SaaS email scheduling and campaign management platform.
