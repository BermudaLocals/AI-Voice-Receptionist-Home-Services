# ReceptionAI

> AI Voice Receptionist for Home Service Businesses

Never miss another call. ReceptionAI answers every inbound call with an AI agent that qualifies leads, checks your calendar, books appointments, and sends instant SMS confirmations — 24/7.

## Features

- **AI Phone Agent** — Answers calls in your business's voice and tone
- **Lead Qualification** — Captures service needed, address, urgency, budget
- **Calendar Sync** — Real-time availability via Google Calendar / Calendly
- **Instant Booking** — Books appointments directly into your calendar
- **SMS Notifications** — Confirmation to customer + summary to owner
- **Call Dashboard** — Recordings, transcripts, revenue attribution
- **Subscription Billing** — Stripe with tiered plans + metered overage
- **Multi-tenant** — Each business has isolated data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Next.js API Routes (Edge + Node) |
| Database | PostgreSQL + Prisma ORM |
| Cache/Queue | Redis (ioredis) |
| Auth | Clerk (Organizations) |
| Telephony | Twilio (Voice + SMS) |
| AI/LLM | OpenAI GPT-4o + TTS |
| Speech-to-Text | Deepgram Nova-2 |
| Calendar | Google Calendar API |
| Billing | Stripe Subscriptions |
| Voice Stream | Standalone WebSocket server |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Accounts: Clerk, Twilio, OpenAI, Stripe, Google Cloud, Deepgram

### 1. Clone & Install

```bash
git clone https://github.com/BermudaLocals/AI-Voice-Receptionist-Home-Services.git
cd AI-Voice-Receptionist-Home-Services
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env with all your API keys
```

### 3. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 4. Database Setup

```bash
cd apps/web
npx prisma generate
npx prisma db push
npx prisma db seed   # Optional: adds demo data
```

### 5. Run Development

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Voice WebSocket server
cd packages/voice-engine
npm install
npm run dev
```

### 6. Configure Twilio

1. Buy a Twilio phone number
2. Set Voice Webhook to: `https://your-ngrok-url/api/webhooks/twilio/voice`
3. Set Status Callback to: `https://your-ngrok-url/api/webhooks/twilio/status`
4. Set Recording Status Callback to: `https://your-ngrok-url/api/webhooks/twilio/recording`

## Project Structure

```
.
├── apps/
│   └── web/                    # Next.js dashboard + API
│       ├── app/                # App Router pages
│       │   ├── (dashboard)/    # Protected dashboard routes
│       │   ├── api/            # API routes & webhooks
│       │   └── ...
│       ├── components/         # React components
│       │   ├── dashboard/      # Dashboard-specific
│       │   └── ui/             # shadcn/ui primitives
│       ├── lib/                # Utilities (db, auth, stripe, etc.)
│       └── prisma/             # Database schema & seed
├── packages/
│   ├── voice-engine/           # WebSocket voice server
│   └── shared/                 # Shared types & constants
├── docker-compose.yml          # Local infrastructure
└── turbo.json                  # Turborepo config
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/twilio/voice` | POST | Incoming call handler |
| `/api/webhooks/twilio/status` | POST | Call status updates |
| `/api/webhooks/twilio/recording` | POST | Recording & transcript |
| `/api/webhooks/stripe` | POST | Subscription events |
| `/api/webhooks/clerk` | POST | User/org lifecycle |
| `/api/calls` | GET | List calls with filters |
| `/api/calls/stats` | GET | Dashboard statistics |
| `/api/bookings` | GET/POST | Booking management |
| `/api/business` | GET/PATCH | Business settings |
| `/api/billing` | GET | Subscription & usage |
| `/api/billing/checkout` | POST | Stripe checkout |
| `/api/calendar/connect` | GET | Google OAuth URL |
| `/api/voice/stream` | WS | Twilio Media Stream |

## Deployment

### Vercel (Dashboard)

```bash
vercel --prod
```

Set all environment variables in Vercel dashboard.

### Railway/Fly.io (Voice Server)

```bash
cd packages/voice-engine
fly deploy
```

Update Twilio voice webhook URL to point to your voice server.

## Pricing Tiers

| Plan | Price | Calls | Overage |
|------|-------|-------|---------|
| Starter | $149/mo | 100 | $0.35/call |
| Professional | $299/mo | 300 | $0.35/call |
| Enterprise | $599/mo | Unlimited | — |

**Add-on:** Outbound review requests — $99/mo

## Security

- All sensitive tokens encrypted at rest (AES-256-GCM)
- Multi-tenant data isolation via Clerk Organizations
- Webhook signature verification (Stripe, Clerk)
- Environment variables for all secrets — no hardcoded keys

## License

MIT

## Support

For questions or issues, open a GitHub issue or contact support@receptionai.dev
