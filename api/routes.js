const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { YoutubeTranscript } = require('youtube-transcript');

// In-memory job store (use Redis in production)
const jobs = new Map();

// WebSocket clients for real-time updates
let wss = null;

function setWSS(server) {
  wss = server;
}

function broadcast(jobId, data) {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.jobId === jobId && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// Python/yt-dlp paths
const BASE_DIR = path.join(__dirname, '..');
const PYTHON_VENV = path.join(BASE_DIR, 'python', 'venv');
const PACKAGED_PYTHON_VENV = process.resourcesPath ? path.join(process.resourcesPath, 'python', 'venv') : null;

function getPythonVenvPath() {
  if (PACKAGED_PYTHON_VENV && fs.existsSync(PACKAGED_PYTHON_VENV)) {
    return PACKAGED_PYTHON_VENV;
  }
  return PYTHON_VENV;
}

const getPythonExecutable = () => {
  const isWin = process.platform === 'win32';
  const binDir = isWin ? 'Scripts' : 'bin';
  const pythonName = isWin ? 'python.exe' : 'python';
  
  const venvPath = getPythonVenvPath();
  const pythonPath = path.join(venvPath, binDir, pythonName);
  if (fs.existsSync(pythonPath)) return pythonPath;
  return isWin ? 'python' : 'python3';
};

const getYtDlpPath = () => {
  const isWin = process.platform === 'win32';
  const binDir = isWin ? 'Scripts' : 'bin';
  const ytDlpName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  
  const venvPath = getPythonVenvPath();
  const ytDlpPath = path.join(venvPath, binDir, ytDlpName);
  if (fs.existsSync(ytDlpPath)) return ytDlpPath;
  return 'yt-dlp';
};

// Run yt-dlp
function runYtDlp(args, jobId) {
  return new Promise((resolve, reject) => {
    const pythonPath = getPythonExecutable();
    const commandArgs = ['-m', 'yt_dlp', ...args];
    
    const childProcess = spawn(pythonPath, commandArgs, {
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      parseProgress(data.toString(), jobId);
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      parseProgress(data.toString(), jobId);
    });

    childProcess.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
    });

    childProcess.on('error', reject);
  });
}

function parseProgress(output, jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
  if (progressMatch) {
    job.progress = parseFloat(progressMatch[1]);
    broadcast(jobId, { type: 'progress', job: { ...job } });
  }

  const destMatch = output.match(/\[ExtractAudio\] Destination: (.+)/);
  if (destMatch) {
    job.items.push({ file: destMatch[1], status: 'completed' });
    broadcast(jobId, { type: 'progress', job: { ...job } });
  }
}

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

// ============ API ROUTES ============

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all download jobs
router.get('/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values()).sort((a, b) => b.startTime - a.startTime);
  res.json(allJobs);
});

// Get specific job
router.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// Create new download job
router.post('/jobs', async (req, res) => {
  try {
    const options = req.body;
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
    
    // Start download asynchronously
    (async () => {
      try {
        job.status = 'running';
        broadcast(jobId, { type: 'status', job: { ...job } });
        
        const args = buildYtDlpArgs(options);
        await runYtDlp(args, jobId);
        
        job.status = 'completed';
        job.progress = 100;
        job.endTime = Date.now();
        broadcast(jobId, { type: 'completed', job: { ...job } });
      } catch (error) {
        job.status = 'error';
        job.error = error.message;
        job.endTime = Date.now();
        broadcast(jobId, { type: 'error', job: { ...job } });
      }
    })();
    
    res.status(201).json({ id: jobId, ...job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel job
router.post('/jobs/:id/cancel', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  job.status = 'cancelled';
  job.endTime = Date.now();
  broadcast(req.params.id, { type: 'cancelled', job: { ...job } });
  
  res.json(job);
});

// Delete job
router.delete('/jobs/:id', (req, res) => {
  const deleted = jobs.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Job not found' });
  res.json({ success: true });
});

// Get playlist info
router.post('/playlist/info', async (req, res) => {
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
router.post('/video/info', async (req, res) => {
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
router.post('/transcript', async (req, res) => {
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
router.post('/formats', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const args = ['-F', '--no-playlist', url];
    const output = await runYtDlp(args, null);
    
    // Parse format output
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

// Download single video/audio (direct download)
router.post('/download', async (req, res) => {
  try {
    const { url, format = 'audio', quality = '1080', audioFormat = 'mp3', outputDir } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const jobId = uuidv4();
    const downloadDir = outputDir || path.join(__dirname, '..', 'downloads');
    
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const options = { url, format, quality, audioFormat, outputDir: downloadDir };
    const args = buildYtDlpArgs(options);
    
    const job = { id: jobId, status: 'running', progress: 0, options, startTime: Date.now() };
    jobs.set(jobId, job);
    
    const result = await runYtDlp(args, jobId);
    
    job.status = 'completed';
    job.progress = 100;
    job.endTime = Date.now();
    
    res.json({ success: true, jobId, output: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system info
router.get('/system/info', (req, res) => {
  const pythonPath = getPythonExecutable();
  const ytDlpPath = getYtDlpPath();
  
  res.json({
    python: pythonPath,
    ytDlp: ytDlpPath,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  });
});

module.exports = { router, setWSS };