# Dockerfile for YouTube Playlist Downloader API Server
FROM node:20-alpine

# Install Python, ffmpeg, and build tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    make \
    gcc \
    g++ \
    linux-headers

# Create app directory
WORKDIR /app

# Copy package files
COPY electron-app/package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy Python requirements and install yt-dlp
COPY electron-app/python/requirements.txt ./python/
RUN python3 -m venv ./python/venv && \
    ./python/venv/bin/pip install --no-cache-dir -r ./python/requirements.txt

# Copy application code
COPY electron-app/main.js ./
COPY electron-app/preload.js ./
COPY electron-app/api ./api
COPY electron-app/dist ./dist
COPY electron-app/assets ./assets

# Create downloads directory
RUN mkdir -p /app/downloads

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start API server
CMD ["node", "api/server.js"]