# The Resume – Backend

This is the backend service for **The Resume** project.  
It powers the interactive resume chatbot and provides APIs for streaming AI-generated responses and managing chat sessions.  
The backend is built with **Spring Boot (WebFlux)**, **R2DBC (PostgreSQL)**, and **OpenAI's GPT models**.

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

## Getting Started

### Prerequisites

- **Java 17+**
- **Gradle 8+**
- **Docker & Docker Compose**
- **OpenAI API Key**