# MatchHire-AI Backend

## Overview

This is the backend service for MatchHire-AI. It provides authentication, resume parsing, profile management, job posting, swipe/match flows, interview question generation, and AI readiness evaluation.

## Requirements

- Node.js 18+ or compatible
- npm
- MongoDB running locally or accessible via a connection string

## Setup

1. Open a terminal and change into the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create your `.env` file by copying the example:

```bash
cp .env.example .env
```

4. Edit `.env` and provide real values:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: strong secret for access tokens
- `JWT_REFRESH_SECRET`: strong secret for refresh tokens
- `PORT`: optional backend port (default `4000`)
- `GEMINI_API_KEY`: optional Gemini AI key for AI-powered features

If you do not set `GEMINI_API_KEY`, the backend still works for most routes, but AI-powered resume parsing, matching, and interview generation will run in fallback mode or return limited results.

## Running the backend

Start the server in development mode:

```bash
npm run dev
```

Start the server in production mode:

```bash
npm start
```

The backend will run on `http://localhost:4000` by default.

## API documentation

Swagger UI is available at:

- `http://localhost:4000/api-docs`

## Important notes

- The backend creates an `uploads/` directory automatically when it starts, if it does not already exist.
- Uploaded resume files are accepted via `multipart/form-data` on the resume parse endpoint.
- The backend uses JWT access tokens for authenticated routes. Send tokens in the `Authorization` header as:

```http
Authorization: Bearer <access_token>
```

## Environment variables

Use `.env.example` as the source of truth. The backend reads:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GEMINI_API_KEY`
- `GEN_API_KEY` (optional fallback)
- `GOOGLE_API_KEY` (optional fallback)

## Health check

A simple health check endpoint is available at:

- `GET /health`

## Swagger

Swagger documentation is mounted inside the app at:

- `GET /api-docs`
