#!/usr/bin/env node
/**
 * Standalone API Server for YouTube Downloader
 * Can be run independently without Electron
 * Usage: node api/server.js
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Configuration
const PORT = process.env.API_PORT || 3001;
const HOST = process.env.API_HOST || '0.0.0.0';

// Paths
const BASE_DIR = path.dirname(__dirname);
const PYTHON_VENV = path.join(BASE_DIR, 'python', 'venv');
// In packaged app, python might be in process.resourcesPath
const PACKAGED_PYTHON_VENV = process.resourcesPath ? path.join(process.resourcesPath, 'python', 'venv') : null;
const DOWNLOADS_DIR = path.join(BASE_DIR, 'downloads');

function getPythonVenvPath() {
  if (PACKAGED_PYTHON_VENV && fs.existsSync(PACKAGED_PYTHON_VENV)) {
    return PACKAGED_PYTHON_VENV;
  }
  return PYTHON_VENV;
}

function getPythonExecutable() {
  const isWin = process.platform === 'win32';
  const binDir = isWin ? 'Scripts' : 'bin';
  const pythonName = isWin ? 'python.exe' : 'python';
  
  const venvPath = getPythonVenvPath();
  const pythonPath = path.join(venvPath, binDir, pythonName);
  if (fs.existsSync(pythonPath)) return pythonPath;
  return isWin ? 'python' : 'python3';
}

function getYtDlpPath() {
  const isWin = process.platform === 'win32';
  const binDir = isWin ? 'Scripts' : 'bin';
  const ytDlpName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  
  const venvPath = getPythonVenvPath();
  const ytDlpPath = path.join(venvPath, binDir, ytDlpName);
  if (fs.existsSync(ytDlpPath)) return ytDlpPath;
  return 'yt-dlp';
}

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// In-memory job store
const jobs = new Map();

// WebSocket client management
const wsClients = new Map();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve downloaded files
app.use('/downloads', express.static(DOWNLOADS_DIR));

// WebSocket handling
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');
  let currentJobId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'subscribe' && data.jobId) {
        currentJobId = data.jobId;
        if (!wsClients.has(currentJobId)) {
          wsClients.set(currentJobId, new Set());
        }
        wsClients.get(currentJobId).add(ws);
        ws.send(JSON.stringify({ type: 'subscribed', jobId: currentJobId }));
        console.log(`Client subscribed to job: ${currentJobId}`);
      }
      
      if (data.type === 'unsubscribe' && data.jobId) {
        if (wsClients.has(data.jobId)) {
          wsClients.get(data.jobId).delete(ws);
        }
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });

  ws.on('close', () => {
    if (currentJobId && wsClients.has(currentJobId)) {
      wsClients.get(currentJobId).delete(ws);
    }
    console.log('WebSocket client disconnected');
  });
});

function broadcastToJob(jobId, data) {
  if (wsClients.has(jobId)) {
    const message = JSON.stringify(data);
    wsClients.get(jobId).forEach(client => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }
}

// yt-dlp execution
function runYtDlp(args, jobId = null) {
  return new Promise((resolve, reject) => {
    const pythonPath = getPythonExecutable();
    const commandArgs = ['-m', 'yt_dlp', ...args];
    
    console.log(`[yt-dlp] ${pythonPath} ${commandArgs.join(' ')}`);
    
    const childProcess = spawn(pythonPath, commandArgs, {
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      cwd: BASE_DIR,
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      if (jobId) parseProgress(output, jobId);
    });

    childProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      if (jobId) parseProgress(output, jobId);
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
    });

    childProcess.on('error', (err) => {
      reject(err);
    });
  });
}

function parseProgress(output, jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  // Progress: [download]  45.2% of 12.34MiB at 1.23MiB/s ETA 00:05
  const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
  if (progressMatch) {
    const percent = parseFloat(progressMatch[1]);
    if (percent !== job.progress) {
      job.progress = percent;
      broadcastToJob(jobId, { type: 'progress', job: { ...job } });
    }
  }

  // Downloaded item
  const destMatch = output.match(/\[ExtractAudio\] Destination: (.+)/);
  if (destMatch) {
    job.items.push({ file: destMatch[1], status: 'completed' });
    broadcastToJob(jobId, { type: 'progress', job: { ...job } });
  }

  // Merge complete
  const mergeMatch = output.match(/\[Merger\] Merging formats into "(.+)"/);
  if (mergeMatch) {
    job.items.push({ file: mergeMatch[1], status: 'completed' });
    broadcastToJob(jobId, { type: 'progress', job: { ...job } });
  }
}

// Build yt-dlp arguments
function buildYtDlpArgs(options) {
  const { 
    url, 
    outputDir, 
    format, 
    quality, 
    audioFormat, 
    audioQuality,
    embedMetadata,
    embedThumbnail,
    writeSubtitles,
    subtitleLanguages,
    writeThumbnail,
    maxDownloads,
    dateAfter,
    dateBefore,
    matchTitle,
    rejectTitle,
    concurrent,
    retries,
    ignoreErrors,
    noOverwrites,
    continueDl,
    playlistStart,
    playlistEnd,
    playlistItems,
  } = options;

  const args = [];
  // Single videos go straight into outputDir; playlists, channels and
  // users get their own subfolder named after the playlist/channel.
  const isPlaylistUrl = /[?&]list=/.test(url || '') || /\/(playlist|channel|c|user|@)/.test(url || '');
  const outputTemplate = isPlaylistUrl
    ? path.join(outputDir, '%(playlist_title,unknown_playlist)s', '%(title)s.%(ext)s')
    : path.join(outputDir, '%(title)s.%(ext)s');
  args.push('-o', outputTemplate);

  if (format === 'audio') {
    args.push('-f', 'bestaudio/best');
    args.push('--extract-audio');
    args.push('--audio-format', audioFormat || 'mp3');
    args.push('--audio-quality', audioQuality || '0');
  } else if (format === 'video') {
    args.push('-f', `bestvideo[height<=${quality || '1080'}]+bestaudio/best[height<=${quality || '1080'}]`);
    args.push('--merge-output-format', 'mp4');
    args.push('--extract-audio');
    args.push('--audio-format', audioFormat || 'mp3');
    args.push('--audio-quality', audioQuality || '0');
    args.push('--keep-video');
  }

  if (embedMetadata) {
    args.push('--embed-metadata');
    args.push('--embed-chapters');
  }
  if (embedThumbnail) args.push('--embed-thumbnail');
  if (writeThumbnail) {
    args.push('--write-thumbnail');
    args.push('--convert-thumbnails', 'jpg');
  }

  if (writeSubtitles) {
    args.push('--write-subs');
    args.push('--write-auto-subs');
    if (subtitleLanguages && subtitleLanguages.length > 0) {
      args.push('--sub-langs', subtitleLanguages.join(','));
    }
    args.push('--convert-subs', 'srt');
  }

  if (playlistStart) args.push('--playlist-start', String(playlistStart));
  if (playlistEnd) args.push('--playlist-end', String(playlistEnd));
  if (playlistItems) args.push('--playlist-items', playlistItems);
  if (dateAfter) args.push('--dateafter', dateAfter);
  if (dateBefore) args.push('--datebefore', dateBefore);
  if (matchTitle) args.push('--match-title', matchTitle);
  if (rejectTitle) args.push('--reject-title', rejectTitle);
  if (maxDownloads) args.push('--max-downloads', String(maxDownloads));
  if (concurrent) args.push('--concurrent-fragments', String(concurrent));
  if (retries) args.push('--retries', String(retries));
  else args.push('--retries', '10');
  if (ignoreErrors) args.push('--ignore-errors');
  if (noOverwrites) args.push('--no-overwrites');
  if (continueDl) args.push('--continue');

  args.push('--newline');
  args.push('--progress');
  args.push('--console-title');
  args.push(url);

  return args;
}

function createDownloadJob(options) {
  const jobId = uuidv4();
  const job = {
    id: jobId,
    status: 'pending',
    progress: 0,
    total: 0,
    current: 0,
    items: [],
    options,
    startTime: Date.now(),
    endTime: null,
    error: null,
  };
  jobs.set(jobId, job);
  return job;
}

async function executeDownloadJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'running';
    broadcastToJob(jobId, { type: 'status', job: { ...job } });

    const args = buildYtDlpArgs(job.options);
    await runYtDlp(args, jobId);

    job.status = 'completed';
    job.progress = 100;
    job.endTime = Date.now();
    broadcastToJob(jobId, { type: 'completed', job: { ...job } });
  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    job.endTime = Date.now();
    broadcastToJob(jobId, { type: 'error', job: { ...job } });
  }
}

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all jobs
app.get('/api/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values()).sort((a, b) => b.startTime - a.startTime);
  res.json(allJobs);
});

// Get specific job
app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// Create new download job
app.post('/api/jobs', async (req, res) => {
  try {
    const options = req.body;
    
    // Validate required fields
    if (!options.url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    if (!options.outputDir) {
      return res.status(400).json({ error: 'outputDir is required' });
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }

    const job = createDownloadJob(options);
    
    // Start download asynchronously
    executeDownloadJob(job.id);
    
    res.status(201).json({ id: job.id, ...job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel job
app.post('/api/jobs/:id/cancel', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  job.status = 'cancelled';
  job.endTime = Date.now();
  broadcastToJob(req.params.id, { type: 'cancelled', job: { ...job } });
  
  res.json(job);
});

// Delete job
app.delete('/api/jobs/:id', (req, res) => {
  const deleted = jobs.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Job not found' });
  res.json({ success: true });
});

// Get playlist info
app.post('/api/playlist/info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const args = [
      '--flat-playlist',
      '--print-json',
      url
    ];
    
    const output = await runYtDlp(args, null);
    const videos = output.trim().split('\n').filter(l => l).map(line => {
      try {
        const data = JSON.parse(line);
        return {
          id: data.id,
          title: data.title,
          duration: data.duration || 0,
          uploader: data.uploader || '',
          viewCount: data.view_count || 0,
          thumbnail: data.thumbnail || '',
          url: `https://www.youtube.com/watch?v=${data.id}`,
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    res.json({ videos, total: videos.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get video info
app.post('/api/video/info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const args = [
      '--print-json',
      '--no-playlist',
      url
    ];
    
    const output = await runYtDlp(args, null);
    const lines = output.trim().split('\n').filter(l => l);
    if (lines.length === 0) return res.status(404).json({ error: 'Video not found' });
    
    const data = JSON.parse(lines[0]);
    
    res.json({
      id: data.id,
      title: data.title,
      duration: data.duration || 0,
      uploader: data.uploader || '',
      viewCount: data.view_count || 0,
      thumbnail: data.thumbnail || '',
      description: data.description || '',
      tags: data.tags || [],
      categories: data.categories || [],
      url: `https://www.youtube.com/watch?v=${data.id}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transcript
app.post('/api/transcript', async (req, res) => {
  try {
    const { url, language = 'en' } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const transcript = await YoutubeTranscript.fetchTranscript(url, { lang: language });
    const formatted = transcript.map(t => ({
      text: t.text,
      start: t.offset / 1000,
      duration: t.duration / 1000,
    }));
    
    res.json({ transcript: formatted, language });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available formats
app.post('/api/formats', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const args = ['-F', '--no-playlist', url];
    const output = await runYtDlp(args, null);
    
    const lines = output.split('\n');
    const formats = [];
    let inFormats = false;
    
    for (const line of lines) {
      if (line.includes('ID') && line.includes('EXT') && line.includes('RESOLUTION')) {
        inFormats = true;
        continue;
      }
      if (inFormats && line.trim()) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          formats.push({
            id: parts[0],
            ext: parts[1],
            resolution: parts[2],
            note: parts.slice(3).join(' '),
          });
        }
      }
    }
    
    res.json({ formats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Direct download (wait for completion)
app.post('/api/download', async (req, res) => {
  try {
    const { url, format = 'audio', quality = '1080', audioFormat = 'mp3', outputDir } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const downloadDir = outputDir || DOWNLOADS_DIR;
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const options = { url, format, quality, audioFormat, outputDir: downloadDir };
    const args = buildYtDlpArgs(options);
    
    const result = await runYtDlp(args, null);
    
    res.json({ success: true, output: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System info
app.get('/api/system/info', (req, res) => {
  res.json({
    python: getPythonExecutable(),
    ytDlp: getYtDlpPath(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    downloadsDir: DOWNLOADS_DIR,
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          YouTube Downloader API Server                       ║
╠══════════════════════════════════════════════════════════════╣
║  REST API:     http://${HOST}:${PORT}/api                         ║
║  WebSocket:    ws://${HOST}:${PORT}                              ║
║  Downloads:    ${DOWNLOADS_DIR}                              ║
║  Python:       ${getPythonExecutable()}                              ║
║  yt-dlp:       ${getYtDlpPath()}                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});