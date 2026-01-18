# AI Spend Tracker - Backend API

Backend API for AI Spend Tracker, built with Express, TypeScript, and Prisma.

## Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (local or hosted)

## Installation

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create your environment file:
   ```sh
   cp .env.example .env
   ```
3. Update `.env` values to match your local setup.

## Environment Variables

See `.env.example` for required variables:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`

## Database Setup

Run migrations:
```sh
npx prisma migrate dev --name init
```

Open Prisma Studio:
```sh
npx prisma studio
```

## Development

- `npm run dev`: start the dev server with auto-reload
- `npm run build`: compile TypeScript to `dist/`
- `npm start`: run the compiled server

## Available Scripts

- `dev`: run the API in development mode
- `build`: compile TypeScript
- `start`: run the compiled output
- `prisma:generate`: generate Prisma client
- `prisma:migrate`: apply migrations
- `prisma:studio`: open Prisma Studio
- `type-check`: run TypeScript checks
- `lint`: run ESLint
- `lint:fix`: fix ESLint issues

## Project Structure

```
backend/
├── prisma/
├── src/
│   ├── config/
│   ├── types/
│   └── utils/
├── .env.example
├── package.json
└── tsconfig.json
```

## API Endpoints

Endpoints will be documented as they are added.

