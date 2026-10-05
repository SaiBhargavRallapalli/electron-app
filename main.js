const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Import API routes
const { router: apiRouter } = require('./api/routes');

let mainWindow = null;
let apiServer = null;
let wss = null;
const downloadJobs = new Map();

// Store reference to Python executable
const getPythonExecutable = () => {
  const isWin = process.platform === 'win32';
  const binDir = isWin ? 'Scripts' : 'bin';
  const pythonName = isWin ? 'python.exe' : 'python';
  
  // In packaged app, __dirname is inside app.asar, python is in extraResources (one level up)
  // In development, python is in project root
  const possiblePaths = [
    path.join(__dirname, '..', 'python', 'venv', binDir, pythonName),  // packaged app (extraResources)
    path.join(__dirname, 'python', 'venv', binDir, pythonName),        // development
    path.join(process.resourcesPath, 'python', 'venv', binDir, pythonName), // alternative packaged path
  ];
  
  for (const pythonPath of possiblePaths) {
    if (fs.existsSync(pythonPath)) return pythonPath;
  }
  return isWin ? 'python' : 'python3'; // fallback to system python
};

const getYtDlpPath = () => {
  const isWin = process.platform === 'win32';
  const binDir = isWin ? 'Scripts' : 'bin';
  const ytDlpName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  
  const possiblePaths = [
    path.join(__dirname, '..', 'python', 'venv', binDir, ytDlpName),
    path.join(__dirname, 'python', 'venv', binDir, ytDlpName),
    path.join(process.resourcesPath, 'python', 'venv', binDir, ytDlpName),
  ];
  
  for (const ytDlpPath of possiblePaths) {
    if (fs.existsSync(ytDlpPath)) return ytDlpPath;
  }
  return 'yt-dlp'; // fallback to system yt-dlp
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    show: false, // Don't show until ready
  });

  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In packaged app, renderer is in app.asar alongside main.js
    const indexPath = path.join(__dirname, 'renderer', 'index.html');
    console.log('Loading index from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start API Server
function startApiServer() {
  const apiApp = express();
  const server = http.createServer(apiApp);
  
  // WebSocket server for real-time updates
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'subscribe') {
          ws.jobId = data.jobId;
          ws.send(JSON.stringify({ type: 'subscribed', jobId: data.jobId }));
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Middleware
  apiApp.use(cors());
  apiApp.use(express.json({ limit: '50mb' }));
  apiApp.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Serve static files
  apiApp.use('/downloads', express.static(path.join(__dirname, 'downloads')));
  
  // API Routes
  apiApp.use('/api', apiRouter);
  
  // Health check
  apiApp.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const PORT = process.env.API_PORT || 3001;
  server.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server ready for real-time updates`);
  });

  apiServer = server;
  return server;
}

// Broadcast to WebSocket clients
function broadcastToJob(jobId, data) {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.jobId === jobId && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// Download job management
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
  downloadJobs.set(jobId, job);
  return job;
}

function updateDownloadJob(jobId, updates) {
  const job = downloadJobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
    broadcastToJob(jobId, { type: 'progress', job });
  }
  return job;
}

function getDownloadJob(jobId) {
  return downloadJobs.get(jobId);
}

function getAllJobs() {
  return Array.from(downloadJobs.values()).sort((a, b) => b.startTime - a.startTime);
}

// Run yt-dlp command
function runYtDlp(args, jobId) {
  return new Promise((resolve, reject) => {
    const ytDlpPath = getYtDlpPath();
    const pythonPath = getPythonExecutable();
    
    // Use python -m yt_dlp for better compatibility
    const command = pythonPath;
    const commandArgs = ['-m', 'yt_dlp', ...args];
    
    console.log(`Running: ${command} ${commandArgs.join(' ')}`);
    
    const childProcess = spawn(command, commandArgs, {
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      // Parse progress from yt-dlp output
      const output = data.toString();
      parseProgress(output, jobId);
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      const output = data.toString();
      parseProgress(output, jobId);
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

// Parse yt-dlp progress output
function parseProgress(output, jobId) {
  const job = downloadJobs.get(jobId);
  if (!job) return;

  // yt-dlp progress format: [download]  45.2% of 12.34MiB at 1.23MiB/s ETA 00:05
  const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
  if (progressMatch) {
    const percent = parseFloat(progressMatch[1]);
    updateDownloadJob(jobId, { progress: percent });
  }

  // Downloaded item
  const destMatch = output.match(/\[ExtractAudio\] Destination: (.+)/);
  if (destMatch) {
    job.items.push({
      file: destMatch[1],
      status: 'completed',
    });
    updateDownloadJob(jobId, { items: job.items });
  }
}

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Download Directory',
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('start-download', async (event, options) => {
  const job = createDownloadJob(options);
  
  // Run download in background
  (async () => {
    try {
      updateDownloadJob(job.id, { status: 'running' });
      
      const args = buildYtDlpArgs(options);
      await runYtDlp(args, job.id);
      
      updateDownloadJob(job.id, { 
        status: 'completed', 
        progress: 100,
        endTime: Date.now() 
      });
    } catch (error) {
      updateDownloadJob(job.id, { 
        status: 'error', 
        error: error.message,
        endTime: Date.now() 
      });
    }
  })();
  
  return job.id;
});

ipcMain.handle('get-job', (event, jobId) => {
  return getDownloadJob(jobId);
});

ipcMain.handle('get-all-jobs', () => {
  return getAllJobs();
});

ipcMain.handle('cancel-job', (event, jobId) => {
  const job = downloadJobs.get(jobId);
  if (job && job.process) {
    job.process.kill();
    updateDownloadJob(jobId, { status: 'cancelled', endTime: Date.now() });
  }
  return true;
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  await shell.openPath(folderPath);
});

ipcMain.handle('get-playlist-info', async (event, url) => {
  try {
    const args = [
      '--flat-playlist',
      '--print-json',
      url
    ];
    const output = await runYtDlp(args, null);
    return parsePlaylistInfo(output);
  } catch (error) {
    throw new Error(`Failed to get playlist info: ${error.message}`);
  }
});

ipcMain.handle('get-video-info', async (event, url) => {
  try {
    const args = [
      '--print-json',
      '--no-playlist',
      url
    ];
    const output = await runYtDlp(args, null);
    return parseVideoInfo(output);
  } catch (error) {
    throw new Error(`Failed to get video info: ${error.message}`);
  }
});

ipcMain.handle('get-transcript', async (event, url, language) => {
  try {
    // Use youtube-transcript npm package
    const { YoutubeTranscript } = require('youtube-transcript');
    const transcript = await YoutubeTranscript.fetchTranscript(url, { lang: language || 'en' });
    return transcript.map(t => ({
      text: t.text,
      start: t.offset / 1000,
      duration: t.duration / 1000,
    }));
  } catch (error) {
    throw new Error(`Failed to get transcript: ${error.message}`);
  }
});

// Build yt-dlp arguments from options
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

  // Output template
  // Single videos go straight into outputDir; playlists, channels and
  // users get their own subfolder named after the playlist/channel.
  const isPlaylistUrl = /[?&]list=/.test(url || '') || /\/(playlist|channel|c|user|@)/.test(url || '');
  const outputTemplate = isPlaylistUrl
    ? path.join(outputDir, '%(playlist_title,unknown_playlist)s', '%(title)s.%(ext)s')
    : path.join(outputDir, '%(title)s.%(ext)s');
  args.push('-o', outputTemplate);

  // Format selection
  if (format === 'audio') {
    args.push('-f', 'bestaudio/best');
    args.push('--extract-audio');
    args.push('--audio-format', audioFormat || 'mp3');
    args.push('--audio-quality', audioQuality || '0'); // 0 = best
  } else if (format === 'video') {
    args.push('-f', `bestvideo[height<=${quality || '1080'}]+bestaudio/best[height<=${quality || '1080'}]`);
    args.push('--merge-output-format', 'mp4');
    // Also extract audio
    args.push('--extract-audio');
    args.push('--audio-format', audioFormat || 'mp3');
    args.push('--audio-quality', audioQuality || '0');
    args.push('--keep-video');
  }

  // Metadata
  if (embedMetadata) {
    args.push('--embed-metadata');
    args.push('--embed-chapters');
  }
  if (embedThumbnail) {
    args.push('--embed-thumbnail');
  }
  if (writeThumbnail) {
    args.push('--write-thumbnail');
    args.push('--convert-thumbnails', 'jpg');
  }

  // Subtitles
  if (writeSubtitles) {
    args.push('--write-subs');
    args.push('--write-auto-subs');
    if (subtitleLanguages && subtitleLanguages.length > 0) {
      args.push('--sub-langs', subtitleLanguages.join(','));
    }
    args.push('--convert-subs', 'srt');
  }

  // Playlist options
  if (playlistStart) args.push('--playlist-start', String(playlistStart));
  if (playlistEnd) args.push('--playlist-end', String(playlistEnd));
  if (playlistItems) args.push('--playlist-items', playlistItems);

  // Filters
  if (dateAfter) args.push('--dateafter', dateAfter);
  if (dateBefore) args.push('--datebefore', dateBefore);
  if (matchTitle) args.push('--match-title', matchTitle);
  if (rejectTitle) args.push('--reject-title', rejectTitle);
  if (maxDownloads) args.push('--max-downloads', String(maxDownloads));

  // Network/Performance
  if (concurrent) args.push('--concurrent-fragments', String(concurrent));
  if (retries) args.push('--retries', String(retries));
  else args.push('--retries', '10');
  
  if (ignoreErrors) args.push('--ignore-errors');
  if (noOverwrites) args.push('--no-overwrites');
  if (continueDl) args.push('--continue');

  // Progress output
  args.push('--newline');
  args.push('--progress');
  args.push('--console-title');

  // URL
  args.push(url);

  return args;
}

function parsePlaylistInfo(output) {
  const lines = output.trim().split('\n').filter(l => l);
  const videos = lines.map(line => {
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
  return { videos, total: videos.length };
}

function parseVideoInfo(output) {
  const lines = output.trim().split('\n').filter(l => l);
  if (lines.length === 0) return null;
  
  try {
    const data = JSON.parse(lines[0]);
    return {
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
    };
  } catch (e) {
    return null;
  }
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  startApiServer();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (apiServer) apiServer.close();
  if (process.platform !== 'darwin') app.quit();
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});