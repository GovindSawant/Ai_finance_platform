# AI Finance Platform

An AI-powered personal finance management app built with Next.js.

## Features

- 📊 Interactive dashboard with financial charts
- 💳 Multi-account support (checking & savings)
- 🤖 AI receipt scanner (Gemini AI + OCR)
- 📱 Smart budgeting with alerts
- 🔄 Recurring transaction tracking
- 🔐 Secure authentication with Clerk

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS, Radix UI, Recharts
- **Backend:** Next.js Server Actions, Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Auth:** Clerk
- **AI:** Google Gemini AI, Tesseract.js OCR
- **Jobs:** Inngest
- **Security:** Arcjet

## Getting Started

### Prerequisites

- Node.js 18+
- Accounts on: [Supabase](https://supabase.com), [Clerk](https://clerk.com), [Google AI Studio](https://makersuite.google.com)

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy and fill in your credentials
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="your-supabase-connection-string"
DIRECT_URL="your-supabase-direct-connection-string"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
CLERK_SECRET_KEY="your-clerk-secret"
NEXT_PUBLIC_CLERK_SIGN_IN_URL=sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=sign-up

GEMINI_API_KEY="your-gemini-api-key"

INNGEST_SIGNING_KEY="your-inngest-signing-key"
INNGEST_EVENT_KEY="your-inngest-event-key"
ARCJET_KEY="your-arcjet-key"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Database GUI |
| `npx prisma db seed` | Seed sample data |

## Project Structure

```
app/           → Pages & API routes (Next.js App Router)
actions/       → Server actions (accounts, transactions, budget)
components/    → Reusable UI components
lib/           → Prisma client, utilities, Inngest config
hooks/         → Custom React hooks
data/          → Categories & static content
prisma/        → Database schema & migrations
__tests__/     → Unit tests
```

## License

Private and proprietary.
