# YouTube Playlist Downloader

A powerful Electron/React application for downloading YouTube playlists, videos, and channels with a modern UI and full REST API support.

## Features

### Download Capabilities
- **Playlist/Channel/Video Downloads** - Paste any YouTube URL (playlist, video, channel, or user)
- **Audio Only (MP3)** - Extract high-quality audio with configurable format and bitrate
- **Video + Audio (MP4)** - Download video with audio, plus separate audio extraction
- **Multiple Formats** - MP3, M4A, OPUS, FLAC, WAV for audio; MP4 for video
- **Quality Selection** - 144p to 8K video quality options

### Advanced Features
- **Metadata Embedding** - Embed title, artist, album, chapters, and thumbnail as cover art
- **Subtitles/Transcripts** - Download subtitles in multiple languages, convert to SRT
- **Playlist Filtering** - Filter by date range, title regex, index ranges, max downloads
- **Concurrent Downloads** - Configurable parallel fragment downloads
- **Resume Support** - Resume interrupted downloads automatically
- **Error Handling** - Ignore errors option for bulk playlist downloads

### Organization
- **Auto-folder Structure** - Creates `Playlist Name/Video Title.mp3` automatically
- **Custom Output Directory** - Choose any local folder for downloads
- **Thumbnail Saving** - Save thumbnails as separate JPG files

### API & Integration
- **REST API** - Full HTTP API for server deployment
- **WebSocket** - Real-time progress updates
- **Headless Mode** - Run API server without UI
- **Cross-platform** - Windows, macOS, Linux support

## Installation

### Quick Start (Recommended)
```bash
cd electron-app
./setup.sh
npm start
```

### Manual Installation

1. **Install Node.js dependencies:**
```bash
cd electron-app
npm install
```

2. **Set up Python environment:**
```bash
cd python
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Build and run:**
```bash
cd ..
npm run build
npm start
```

### Development Mode
```bash
npm run dev
```

## Usage

### Desktop App
1. Launch the app
2. Paste a YouTube URL (playlist, video, or channel)
3. Select output directory
4. Choose format (Audio/Video) and quality
5. Click "Start Download"

### API Server
```bash
# Start API server only (no UI)
npm run api

# Or run directly
node api/server.js
```

API available at: `http://localhost:3001/api`

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/jobs` | List all download jobs |
| GET | `/jobs/:id` | Get job details |
| POST | `/jobs` | Create new download job |
| POST | `/jobs/:id/cancel` | Cancel a job |
| DELETE | `/jobs/:id` | Delete a job (also wipes its staged server files) |
| GET | `/jobs/:id/files/:index` | Save a finished file to your device |
| DELETE | `/jobs/:id/files` | Wipe all staged files of a job (keeps record) |
| DELETE | `/jobs/:id/files/:index` | Wipe one staged file of a job |
| POST | `/playlist/info` | Get playlist info |
| POST | `/video/info` | Get video info |
| POST | `/transcript` | Get video transcript |
| POST | `/formats` | Get available formats |
| POST | `/download` | Direct download |
| GET | `/system/info` | System information |

#### WebSocket
Connect to `ws://localhost:3001` for real-time updates:
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'subscribe', jobId: 'YOUR_JOB_ID' }));
};
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data.job.progress);
};
```

### Example API Usage

**Start a download:**
```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/playlist?list=PLjhrDIztP9pdbGU8q1kKB3V5_Jpx5eIwk",
    "outputDir": "/path/to/downloads",
    "format": "audio",
    "audioFormat": "mp3",
    "audioQuality": "0",
    "embedMetadata": true,
    "embedThumbnail": true
  }'
```

**Get playlist info:**
```bash
curl -X POST http://localhost:3001/api/playlist/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/playlist?list=PLjhrDIztP9pdbGU8q1kKB3V5_Jpx5eIwk"}'
```

**Get transcript:**
```bash
curl -X POST http://localhost:3001/api/transcript \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw", "language": "en"}'
```

## Project Structure

```
electron-app/
├── main.js              # Electron main process + API server
├── preload.js           # Electron preload script (IPC bridge)
├── package.json         # Node.js dependencies
├── vite.config.js       # Vite configuration
├── setup.sh             # Automated setup script
├── index.html           # HTML entry point
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main app component
│   ├── index.css        # Global styles
│   ├── components/      # React components
│   │   ├── DownloadForm.jsx
│   │   ├── FormatOptions.jsx
│   │   ├── AdvancedOptions.jsx
│   │   ├── PreviewPanel.jsx
│   │   ├── JobList.jsx
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── SettingsPanel.jsx
│   └── hooks/           # Custom React hooks
│       ├── useElectronAPI.js
│       ├── useDownloads.js
│       └── useSettings.js
├── api/
│   └── routes.js        # Express API routes
└── python/
    ├── requirements.txt # Python dependencies
    └── venv/            # Virtual environment (created on setup)
```

## Configuration

Settings are stored in localStorage and can be configured in the Settings tab:
- Default format, quality, audio format
- Default output directory
- Behavior options (notifications, tray, auto-open)
- Advanced defaults (retries, concurrent fragments, error handling)

## Building for Distribution

```bash
npm run build
```

Output will be in `dist/` directory with platform-specific installers.

## Requirements

- **Node.js** 18+
- **Python** 3.8+
- **yt-dlp** (installed via setup script)
- **ffmpeg** (required for audio/video merging - install separately):
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: Download from ffmpeg.org

## License

MIT License - feel free to use and modify.

## Troubleshooting

### yt-dlp not found
Run setup again or manually:
```bash
cd python
source venv/bin/activate
pip install -U yt-dlp
```

### ffmpeg missing
Install ffmpeg for your platform (see Requirements above).

### Permission errors on macOS/Linux
```bash
chmod +x setup.sh
```

### Port 3001 already in use
Change `API_PORT` environment variable:
```bash
API_PORT=3002 npm run api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The amazing download engine
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool