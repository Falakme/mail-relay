# Falak Mail Relay

A secure and reliable mail relay service built with Next.js, featuring automatic failover between NotificationAPI (primary) and Brevo (fallback).

## Features

- 🔄 **Dual Provider Support**: Primary delivery via NotificationAPI with automatic Brevo fallback
- 📊 **Comprehensive Logging**: Every email logged with timestamp, recipient, subject, status, and provider
- ⚙️ **Admin Dashboard**: Manage API keys, view logs, and monitor system status
- 🔐 **Secure Authentication**: Site key-based admin login
- 🎨 **Modern UI**: Responsive design with dark mode support using Tailwind CSS
- 📱 **Mobile Friendly**: Works seamlessly on all devices

## Tech Stack

- **Framework**: Next.js 16.1.4 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with FalakSans font
- **Database**: SQLite (via better-sqlite3)
- **Email Providers**: NotificationAPI, Brevo

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- NotificationAPI account
- Brevo account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Falakme/mail-relay.git
cd mail-relay
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
SITE_KEY=your-secure-site-key
NOTIFICATIONAPI_CLIENT_ID=your-client-id
NOTIFICATIONAPI_CLIENT_SECRET=your-client-secret
BREVO_API_KEY=your-brevo-api-key
```

5. Start the development server:
```bash
bun dev
# or
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## API Usage

### Send Email

```bash
POST /api/send-mail
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Plain text body",
  "html": "<p>Optional HTML body</p>",
  "from": "sender@example.com",
  "replyTo": "reply@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully via NotificationAPI",
  "provider": "notificationapi",
  "logId": "uuid"
}
```

### Check Status

```bash
GET /api/status
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "totalEmailsSent": 42,
  "rateLimits": {
    "notificationapi": { "isLimited": false, "backoffUntil": 0 },
    "brevo": { "isLimited": false, "backoffUntil": 0 }
  },
  "timestamp": "2026-01-26T10:00:00.000Z"
}
```

## Admin Panel

Access the admin panel at `/admin` and login with your `SITE_KEY`.

### Features:
- **Email Logs**: View all sent emails with status, provider, and timestamps
- **API Keys**: Manage API keys for NotificationAPI, Brevo, or custom services
- **System Status**: Monitor health, total emails, and rate limit status

## Project Structure

```
mail-relay/
├── app/
│   ├── api/
│   │   ├── send-mail/route.ts    # Email sending endpoint
│   │   ├── auth/route.ts          # Authentication endpoint
│   │   ├── logs/route.ts          # Email logs endpoint
│   │   ├── api-keys/route.ts      # API keys management
│   │   └── status/route.ts        # System status endpoint
│   ├── admin/page.tsx             # Admin dashboard
│   ├── page.tsx                   # Home page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── lib/
│   ├── types.ts                   # TypeScript types
│   ├── database.ts                # SQLite database layer
│   ├── email-service.ts           # Email sending logic
│   └── auth.ts                    # Authentication utilities
└── data/                          # SQLite database (auto-created)
```

## NotificationAPI Setup

1. Create an account at [NotificationAPI](https://www.notificationapi.com/)
2. Create a new notification template named `email_relay`
3. Configure the template with merge tags: `{{subject}}`, `{{body}}`, `{{html}}`
4. Copy your Client ID and Client Secret to your `.env.local`

## Brevo Setup

1. Create an account at [Brevo](https://www.brevo.com/)
2. Go to Settings > SMTP & API > API Keys
3. Generate a new API key
4. Copy the API key to your `.env.local`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

**Note**: For production, consider using a persistent database solution instead of SQLite (e.g., PostgreSQL, PlanetScale).

### Docker

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "start"]
```

## Security Considerations

- Store `SITE_KEY` securely and use a strong, random value
- API keys in the database are stored as-is; consider encryption for production
- Use HTTPS in production
- Implement rate limiting for the send-mail endpoint in production

## Brand Colors

- Primary Background: `#0000C0`
- Accent/Highlights: `#000040`
- Font: FalakSans

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
