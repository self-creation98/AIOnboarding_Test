FROM nikolaik/python-nodejs:python3.11-nodejs20-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies and build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend source
COPY src/ ./src/
COPY .env* ./
# Make sure any other files needed are copied

# Start command
CMD sh -c "uvicorn src.backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"
