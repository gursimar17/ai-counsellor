# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Match your current structure - calling main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]