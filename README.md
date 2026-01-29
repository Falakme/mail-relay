# Falak Mail Relay

Falak Mail Relay is a production‑ready email relay and admin console built with Next.js and Convex. It sends email via Brevo (primary) with NotificationAPI as a fallback, and provides a secure admin dashboard to manage API keys, logs, and system health.

## Highlights

- 🔁 **Provider failover** (Brevo → NotificationAPI)
- 📜 **Structured logging** for every email
- 🔐 **Hardened auth** with HMAC‑signed sessions and bearer token support
- 🧰 **Admin UI** for logs, keys, and health metrics
- ☁️ **Serverless Convex backend**
- 🎨 **Modern UI** with Tailwind CSS v4 and FalakSans

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript (strict)**
- **Tailwind CSS v4**
- **Convex** (serverless DB)
- **Brevo + NotificationAPI**
- **Bun** (recommended) or Node.js 18+

## Quick Start

```bash
git clone https://github.com/Falakme/mail-relay.git
cd mail-relay
bun install
bunx convex dev
```

Create your environment file:

```bash
cp example.env .env
```

Start the app:

```bash
bun dev
```

Open http://localhost:3000

## Configuration

All configuration is via environment variables. A ready‑to‑copy file lives at example.env.

Required:
- `SITE_KEY`
- `BREVO_API_KEY`
- `NOTIFICATIONAPI_CLIENT_ID`
- `NOTIFICATIONAPI_CLIENT_SECRET`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`

Optional:
- `DEFAULT_FROM_EMAIL`

## API Endpoints

### Send Email

`POST /api/send-mail`

Headers:
- `Authorization: Bearer <API_KEY>`
- `Content-Type: application/json`

Body:
- `to` (string, required)
- `subject` (string, required)
- `body` (string, required)
- `html` (string, optional)
- `from` (string, optional)
- `senderName` (string, optional)
- `replyTo` (string, optional)

### Status

`GET /api/status?hours=24`

Returns health, deliverability metrics, and rate‑limit status.

### Admin Auth

`POST /api/auth`

Actions:
- `login` (requires `siteKey`)
- `logout`
- `check`

### API Keys (Admin)

`GET /api/api-keys`
`POST /api/api-keys`
`PUT /api/api-keys`
`DELETE /api/api-keys`

### Logs (Admin)

`GET /api/logs?limit=50&offset=0`
`DELETE /api/logs`

## Admin Dashboard

Visit `/` and log in with your `SITE_KEY`.

Features:
- **Email Logs** with metadata
- **API Key management** (create, rotate, enable/disable, delete)
- **System Status** with deliverability stats and provider rate‑limit state

## Authentication & Security

- Admin sessions are **HMAC‑signed** and stored as httpOnly cookies.
- API keys are **HMAC‑SHA256 hashed** using `SITE_KEY` and are never stored in plaintext.
- Bearer tokens are supported for cross‑origin automation.

## Testing

```bash
bun test
bun test:watch
```

## Project Structure

```
mail-relay/
├── app/
│   ├── api/                # Route handlers
│   ├── page.tsx            # Admin UI
│   └── globals.css         # Global styles
├── convex/                 # Convex schema + functions
├── lib/                    # Core logic (auth, email, crypto)
├── test/                   # Test setup
└── example.env             # Copy to .env
```

## Convex Setup

Run `bunx convex dev` to create a deployment. The Convex schema defines:
- `emailLogs` (timestamp, status, provider, metadata)
- `apiKeys` (hashed key + usage tracking)

## Provider Setup

**NotificationAPI**
1. Create a template named `email_relay`
2. Add merge tags `{{subject}}`, `{{body}}`, `{{html}}`
3. Copy Client ID + Secret into `.env`

**Brevo**
1. Generate a transactional API key
2. Set `BREVO_API_KEY`

## Deployment

Recommended: Vercel.

Set all required environment variables in the deployment platform, then run:

```bash
bun run build
bun run start
```

## Notes

- Rate limiting is handled per‑provider using in‑memory backoff and resets on deploy/restart.
- The SQLite module in [lib/database.ts](lib/database.ts) is legacy and not used in the Convex‑backed runtime.
- Accent/Highlights: `#000040`
- Font: FalakSans

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
