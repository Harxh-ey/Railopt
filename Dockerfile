# -- Stage 1: Build React frontend ------------------------------
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# -- Stage 2: Python backend + serve frontend --------------------
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy compiled frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Render injects PORT env var; default to 8000 for local
ENV PORT=8000

EXPOSE 8000

# Start uvicorn from backend directory
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
