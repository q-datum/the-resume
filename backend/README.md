# The Resume – Backend

This is the backend service for **The Resume** project.  

It powers the interactive resume chatbot and provides APIs for streaming AI-generated responses and managing chat sessions.  
The backend is built with **Spring Boot (WebFlux)**, **R2DBC (PostgreSQL)**, and **OpenAI's GPT models**.

Additionally, it provides a contact form, which forwards users' messages to a Telegram chat.

---

## Features

- **Interactive Resume Chatbot** – Streams AI responses for user queries.
- **Reactive Stack** – Built with Spring WebFlux for high concurrency and reactive programming.
- **PostgreSQL Database** – Stores chat sessions and messages using R2DBC.
- **OpenAI Integration** – Connects with OpenAI's Chat Completions API.
- **Server-Sent Events (SSE)** – Streams tokens in real-time.
- **Environment-based Config** – Configured for development and production environments via Docker and `.env` files.

---

## Tech Stack

- **Language:** Java 17
- **Frameworks:** Spring Boot 3.x, Spring WebFlux
- **Database:** PostgreSQL 15, R2DBC (Reactive Postgres driver)
- **Build Tool:** Gradle
- **Containerization:** Docker & Docker Compose
- **OpenAI API:** GPT-4o-mini (streaming completions)

---

## API overview

All API routes are served under `/api` (Nginx proxies `/api/*` to the backend container).

### Chat
Base path: `/api/chat`

- `POST /api/chat/session?recaptchaToken=...`  
  Creates a chat session + returns JWT token.

- `POST /api/chat/renew?recaptchaToken=...` (requires `Authorization: Bearer <token>`)  
  Renews JWT token (rate-limited).

- `GET /api/chat/stream?message=...` (SSE, requires `Authorization`)  
  Streams the assistant response via **Server-Sent Events**.

- `GET /api/chat/history` (requires `Authorization`)  
  Returns chat history for the current session.

### Contact
Base path: `/api/contact`

- `POST /api/contact`  
  Sends a contact request (includes a `recaptchaToken` in the JSON body).

