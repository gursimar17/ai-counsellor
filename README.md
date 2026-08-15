# 🎓 AI Study-Abroad Counsellor

An AI-powered full-stack web application designed to guide students through the study-abroad application process. The platform provides personalized university recommendations, application tracking, and interactive AI counseling using Google Gemini.

---

## 🛠️ Technical Stack

* **AI Core:** Google Gemini 1.5 Flash (2026 SDK)
* **Backend:** Python (FastAPI, Pydantic, SQLAlchemy)
* **Frontend:** React / Node.js
* **Database:** PostgreSQL (Containerized with Docker Named Volumes for data persistence)
* **Containerization:** Docker & Docker Compose
* **CI/CD Pipeline:** Jenkins (Automated build & deployment via GitHub Webhooks)
* **Cloud Infrastructure:** AWS EC2

---

## 🏗️ Architecture & Features

* **Multi-Container Deployment:** Orchestrated backend, frontend, and database services using Docker Compose over a secure internal container network.
* **Persistent Storage:** PostgreSQL state is preserved across container restarts using Docker volumes (`postgres_data`).
* **Interactive AI Guidance:** Real-time counseling sessions powered by Gemini API integration.
* **Secure Environment Handling:** Zero hardcoded credentials; all API keys and secrets are injected safely via environment variables.

---

## 🚀 Local Development Setup

### **Prerequisites**
* [Docker](https://www.docker.com/) & Docker Compose installed
* [Node.js](https://nodejs.org/) (v18+)
* Python 3.10+

---
