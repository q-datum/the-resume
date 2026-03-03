# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time env for Vite
ARG VITE_RECAPTCHA_SITE_KEY
ARG VITE_API_BASE_URL=/api

# Fail build if site key is missing/empty
RUN test -n "$VITE_RECAPTCHA_SITE_KEY" || (echo "ERROR: VITE_RECAPTCHA_SITE_KEY is required (build arg)"; exit 1)

ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80