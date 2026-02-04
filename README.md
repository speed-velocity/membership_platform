# Cinematic Membership Platform

A full-stack subscription-based membership platform with cinematic dark mode UI. Supports real-time email notifications.

## Quick Start

```bash
npm install
cp .env.example .env    # Edit .env with your admin email, password, and SMTP settings
npm run init-db        # Creates admin from .env
npm run dev            # Starts backend + frontend
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Configuration (.env)

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Your admin login email |
| `ADMIN_PASSWORD` | Your admin password |
| `SMTP_HOST` | SMTP server (e.g. smtp.gmail.com) |
| `SMTP_PORT` | Usually 587 |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | App password (Gmail: [App Passwords](https://myaccount.google.com/apppasswords)) |
| `NOTIFICATION_EMAIL` | Where admin notifications go (new signups, requests) |

**Admin login:** http://localhost:5173/admin/login

## Features

### Users
- Sign up / Log in
- Dashboard with subscription plan, dates, remaining days
- **Payment page** to subscribe (Basic $9.99, Premium $14.99, Ultimate $19.99/mo — simulated)
- Premium video content (1080p/4K) when subscription is active
- Movie requests (2 per rolling 12-hour window) with countdown timer

### Admin
- **Separate admin login** at /admin/login
- **Active Subscriptions** — view all members with active membership
- View all users
- Manage subscriptions
- Upload and categorize premium content
- Monitor and manage movie requests
- Modify request limits

### System
- Automatic subscription expiry
- Role-based access control
- **Real-time email notifications** (when SMTP configured):
  - New signup → admin
  - New movie request → admin
  - New subscription → user + admin
  - Subscription expiring (3 days) → member
  - Subscription expired → member
