
 !!!### OPEN THIS IN CODE VIEW ###!!!


# AI Finance Platform

> An AI-powered personal finance management application built with Next.js

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-green)](https://prisma.io/)

## ✨ Features

- 📊 **Interactive Dashboard** - Real-time financial insights with beautiful charts
- 💳 **Multi-Account Support** - Track checking, savings, and investment accounts
- 🤖 **AI Receipt Scanner** - Extract transaction data from receipts using OCR and Gemini AI
- 📱 **Smart Budgeting** - Set spending limits with intelligent alerts
- 🔄 **Recurring Transactions** - Automated income and expense tracking
- 🔐 **Secure Authentication** - Enterprise-grade auth with Clerk
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI components

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | Clerk |
| **AI/ML** | Google Gemini AI, Tesseract.js OCR |
| **Background Jobs** | Inngest |
| **Security** | Arcjet |
| **Charts** | Recharts |

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** (version 18 or higher)
- **Git** for version control

You'll also need accounts for these services:
- [Supabase](https://supabase.com) (Database)
- [Clerk](https://clerk.com) (Authentication)
- [Google AI Studio](https://makersuite.google.com) (AI features)
- [Inngest](https://inngest.com) (Background jobs)
- [Arcjet](https://arcjet.com) (Security)

---

## 🚀 Quick Start (For Experienced Users)

```bash
# 1. Clone and install
git clone https://github.com/GovindSawant/Ai_finance_platform
cd ai_finance_app
npm install

# 2. Set up services (see detailed instructions below)
# - Create Supabase project and run SQL schema
# - Set up Clerk, Google AI, Inngest, and Arcjet accounts
# - Configure environment variables in .env

# 3. Set up database
npx prisma generate

# 4. (Optional) Seed with sample data
npx prisma db seed

# 5. Start development server
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000) and sign up!

---

## 📖 Detailed Setup Guide

### Step 1: Clone the Repository

```bash
git clone <your-github-repo-url>
cd ai_finance_app
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up External Services

#### 🔐 Clerk Authentication
1. Visit [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Configure authentication methods (email/password recommended)
4. In API Keys section, copy:
   - **Publishable key**
   - **Secret key**
5. Configure redirect URLs:
   - Sign-in: `http://localhost:3000/sign-in`
   - Sign-up: `http://localhost:3000/sign-up`
   - After sign-in: `http://localhost:3000/dashboard`
   - After sign-up: `http://localhost:3000/dashboard`

#### 🤖 Google AI (Gemini)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key
5. **Security Note:** Keep this key safe and never commit it to version control

#### ⚡ Inngest (Background Jobs)
1. Visit [inngest.com](https://inngest.com) and create an account
2. Create a new application
3. Go to **Keys** section and copy:
   - **Signing key** (for `INNGEST_SIGNING_KEY`)
   - **Event key** (for `INNGEST_EVENT_KEY`)
4. *Note: Used for recurring transactions and background processing*

#### 🛡️ Arcjet (Security)
1. Visit [arcjet.com](https://arcjet.com) and create an account
2. Create a new application
3. Copy your **API key** from the dashboard
4. *Note: Provides rate limiting and security features*

#### 🗄️ Supabase Database
1. Visit [supabase.com](https://supabase.com) and create an account
2. Create a new project (choose your region)
3. Wait for provisioning to complete (~2-3 minutes)
4. Go to **SQL Editor** in your dashboard
5. Copy and paste this complete SQL schema:

```sql
-- Create custom types (enums)
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "AccountType" AS ENUM ('CURRENT', 'SAVINGS');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "RecurringInterval" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- Create users table
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerkUserId" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE "accounts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" "AccountType" NOT NULL,
  "balance" DECIMAL(10,2) DEFAULT 0,
  "isDefault" BOOLEAN DEFAULT false,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE "transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "TransactionType" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "category" TEXT NOT NULL,
  "receiptUrl" TEXT,
  "isRecurring" BOOLEAN DEFAULT false,
  "recurringInterval" "RecurringInterval",
  "nextRecurringDate" TIMESTAMP WITH TIME ZONE,
  "lastProcessed" TIMESTAMP WITH TIME ZONE,
  "status" "TransactionStatus" DEFAULT 'COMPLETED',
  "userId" UUID NOT NULL,
  "accountId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE "budgets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "amount" DECIMAL(10,2) NOT NULL,
  "lastAlertSent" TIMESTAMP WITH TIME ZONE,
  "userId" UUID NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");
CREATE INDEX "transactions_accountId_idx" ON "transactions"("accountId");
CREATE INDEX "budgets_userId_idx" ON "budgets"("userId");

-- Create foreign key constraints
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security (recommended for Supabase)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;
```

### Step 4: Configure Environment Variables

1. Create a new `.env` file in the root directory of your project
2. Update all variables with your service credentials:

```env
# Database
DATABASE_URL="your-supabase-connection-string"
DIRECT_URL="your-supabase-connection-string"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

# Background Jobs
INNGEST_SIGNING_KEY="your-inngest-signing-key"
INNGEST_EVENT_KEY="your-inngest-event-key"

# Security
ARCJET_KEY="your-arcjet-api-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 5: Set Up Database Schema

```bash
# Generate Prisma client
npx prisma generate

# (Optional) Push schema to database (skip if you ran the SQL manually)
npx prisma db push
```

### Step 6: (Optional) Seed Sample Data

Populate your database with sample transactions:

```bash
npx prisma db seed
```

*Alternative: Call the `/api/seed` endpoint after starting the server*

### Step 7: Start the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Step 8: Access Your Application

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Click **"Sign Up"** to create your account
3. Start managing your finances!

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build application for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality |

---

## 🏗️ Project Structure

```
ai_finance_app/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 (auth)/            # Authentication pages
│   ├── 📁 (main)/            # Main application pages
│   ├── 📁 api/               # API routes
│   └── 📁 lib/               # Utility libraries
├── 📁 components/            # Reusable UI components
├── 📁 lib/                   # Core configurations
├── 📁 prisma/               # Database schema & migrations
├── 📁 actions/              # Server actions
├── 📁 hooks/                # Custom React hooks
├── 📁 data/                 # Static data & constants
└── 📁 scripts/              # Utility scripts
```

---

## 🔧 Troubleshooting

### Common Issues

**❌ Prisma connection errors**
```bash
# Try regenerating Prisma client
npx prisma generate

# Or reset the database
npx prisma db push --force-reset
```

**❌ Authentication not working**
- Verify Clerk redirect URLs match your `.env` configuration
- Check that `NEXT_PUBLIC_APP_URL` is set correctly

**❌ AI features not working**
- Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is valid
- Check Google AI Studio API quotas

**❌ Database connection issues**
- Verify Supabase connection string
- Ensure database is not paused (Supabase free tier pauses after inactivity)

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all external services are properly configured
4. Check Supabase dashboard for database status

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes and test thoroughly
4. **Commit** your changes: `git commit -m 'Add amazing feature'`
5. **Push** to the branch: `git push origin feature/amazing-feature`
6. **Open** a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 🙏 Acknowledgments

Built with ❤️ using modern web technologies. Special thanks to the open-source community for the amazing tools and libraries that make this project possible.


 
 
