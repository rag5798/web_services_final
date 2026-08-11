# REST API Service

**Live demo:** [web-services-final.onrender.com](https://web-services-final.onrender.com) · [Interactive API docs](https://web-services-final.onrender.com/api-docs)
*(Hosted on Render's free tier — the first load after idle can take up to a minute.)*

A secured RESTful API built with Node.js, Express, and MongoDB. It supports full CRUD operations on a protected resource, token- and session-based authentication, Google OAuth 2.0 sign-in, and interactive API documentation via Swagger.

This project was built to practice designing a production-minded backend: not just routes and a database, but the layers around them — authentication, input validation, security headers, rate limiting, and documented endpoints.

## Features

- **Full CRUD REST API** for an `items` resource, backed by MongoDB via Mongoose models
- **Authentication two ways:** JWT-based auth for API clients and session-based login for browser flows
- **Google OAuth 2.0** sign-in using Passport.js
- **Password security** with bcrypt hashing
- **Input validation** on incoming requests using express-validator
- **Security hardening** with Helmet (HTTP security headers) and express-rate-limit
- **Persistent sessions** stored in MongoDB with connect-mongo
- **Interactive API docs** generated with Swagger (OpenAPI), served at `/api-docs`
- **Request logging** with Morgan and centralized error handling

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB + Mongoose |
| Auth | JWT, Passport.js (Google OAuth 2.0), bcrypt, express-session |
| Validation | express-validator |
| Security | Helmet, express-rate-limit |
| Docs | Swagger / OpenAPI (swagger-ui-express, swagger-jsdoc) |
| Logging | Morgan |

## API Endpoints

Base path: `/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/items` | Public | List all items |
| GET | `/items/:id` | Public | Get a single item by ID |
| POST | `/items` | Required | Create a new item |
| PUT | `/items/:id` | Required | Update an existing item |
| DELETE | `/items/:id` | Required | Delete an item |
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Log in and receive a token |
| GET | `/me` | Required | Get the current authenticated user |
| DELETE | `/auth/account` | Required | Delete the current user's account |
| GET | `/google` | Public | Begin Google OAuth sign-in |
| GET | `/google/callback` | Public | Google OAuth callback |

Full request/response details are available in the Swagger UI at `/api-docs` when the server is running.

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- A MongoDB database (local or hosted, e.g. MongoDB Atlas)
- Google OAuth credentials (for the OAuth sign-in feature)

### Installation

```bash
git clone https://github.com/rag5798/web_services_final.git
cd web_services_final
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NODE_ENV=development
PORT=3000
```

### Running the App

```bash
# development (auto-reload)
npm run dev

# production
npm start
```

The API will be available at `http://localhost:3000`, and the interactive docs at `http://localhost:3000/api-docs`.

## Project Structure

```
├── config/       # Passport strategies and configuration
├── database/     # MongoDB connection setup
├── docs/         # Generated Swagger definition
├── middleware/   # Auth and other middleware
├── routers/      # Route definitions (items, auth, oauth)
├── scripts/      # Swagger generation script
└── server.js     # App entry point
```

## What I Learned

- Structuring an Express application with separate router, middleware, config, and database layers
- Combining stateless (JWT) and stateful (session) authentication in one app
- Implementing third-party sign-in with the OAuth 2.0 authorization code flow
- Generating and maintaining API documentation as part of the build process
- Applying baseline production concerns: security headers, rate limiting, and centralized error handling
