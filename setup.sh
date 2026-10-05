#!/bin/bash
# Setup script for YouTube Playlist Downloader

set -e

echo "🎬 YouTube Playlist Downloader - Setup"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required (found v$NODE_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) found"

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo "Please install Python 3.8+ from https://python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION found"

# Check for pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${YELLOW}Warning: pip3 not found, trying python3 -m pip${NC}"
    PIP_CMD="python3 -m pip"
else
    PIP_CMD="pip3"
fi

# Navigate to project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
cd "$PROJECT_DIR"

echo ""
echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "🐍 Setting up Python environment..."
cd python

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
fi

# Activate and install
source venv/bin/activate
$PIP_CMD install --upgrade pip
$PIP_CMD install -r requirements.txt

echo -e "${GREEN}✓${NC} Python dependencies installed"

# Verify yt-dlp
if "$PROJECT_DIR/python/venv/bin/yt-dlp" --version &> /dev/null; then
    YTDLP_VERSION=$("$PROJECT_DIR/python/venv/bin/yt-dlp" --version)
    echo -e "${GREEN}✓${NC} yt-dlp $YTDLP_VERSION installed"
else
    echo -e "${RED}Error: yt-dlp installation failed${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

echo ""
echo "🔨 Building frontend..."
npm run build

echo ""
echo -e "${GREEN}======================================"
echo "✅ Setup complete!"
echo "======================================${NC}"
echo ""
echo "To start the app:"
echo "  cd $PROJECT_DIR"
echo "  npm start"
echo ""
echo "To run in development mode:"
echo "  npm run dev"
echo ""
echo "To run API server only:"
echo "  npm run api"
echo ""
echo "API will be available at: http://localhost:3001/api"
echo "WebSocket at: ws://localhost:3001"