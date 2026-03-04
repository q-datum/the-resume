# The Resume

Personal resume/portfolio website with an **AI chat assistant** and a **contact form**.

Live: https://resume.muryshkin.net

---

## What’s inside

- **Frontend**: React + TypeScript + Vite
- **Backend**: Java 17, Spring Boot (WebFlux), R2DBC
- **Database**: PostgreSQL (stores chat sessions/messages)
- **Reverse proxy**: Nginx
- **Abuse protection**: reCAPTCHA + IP rate limiting
- **Notifications**: Contact form notifies via Telegram bot

---

## Repo structure

- `frontend/` — Vite SPA + production Nginx config
- `backend/` — Spring Boot WebFlux API
- `docker-compose.dev.yml` — development stack (hot reload)
- `docker-compose.prod.yml` — production stack (build locally with Docker)
- `docker-compose.prod.images.yml` — server-side production stack (build on a pipeline, compose on the server)

---

## Build & Deploy

This project is designed so that the **VPS only runs containers** (no builds). Building the frontend (`vite build`) and backend (`gradle bootJar`) on a small VPS can cause OOM issues, so images are built locally or in CI and then pulled on the server.

### Build-time vs runtime configuration

There are two categories of configuration:

**Build-time (baked into the frontend bundle)**
These must be available when building the `nginx` image (because Vite injects `VITE_*` values at build time):

- `VITE_RECAPTCHA_SITE_KEY` (required)
- `VITE_API_BASE_URL` (optional, default `/api`)

**Runtime (injected into containers on startup)**
These live in the VPS-side `.env` and are used by backend/postgres at runtime:

- Postgres: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Backend: `SPRING_R2DBC_URL`, `SPRING_R2DBC_USERNAME`, `SPRING_R2DBC_PASSWORD`,
  `OPENAI_API_KEY`, `JWT_SECRET`, `RECAPTCHA_SECRET_KEY`, `TELEGRAM_*`, etc.

> Important: do **not** bake backend secrets into images. Keep them only in `.env` on the server.

---

### Local production build

Create `.env` in the repository root (example values):

```env
# ---- postgres ----
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=the_resume

# ---- backend ----
SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/the_resume
SPRING_R2DBC_USERNAME=...
SPRING_R2DBC_PASSWORD=...
OPENAI_API_KEY=...
JWT_SECRET=...
RECAPTCHA_SECRET_KEY=...

# ---- Telegram ----
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# ---- frontend (dev + build) ----
VITE_RECAPTCHA_SITE_KEY=...
VITE_API_BASE_URL=/api
```
### Build and start the production stack locally:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Then open the site (configured as http://localhost:8088 in prod docker compose).

### Dev Build (hot swap)
```bash
docker compose -f docker-compose.dev.yml --env-file .env up -d --build
```
