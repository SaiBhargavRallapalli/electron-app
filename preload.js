const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Directory selection
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Download management
  startDownload: (options) => ipcRenderer.invoke('start-download', options),
  getJob: (jobId) => ipcRenderer.invoke('get-job', jobId),
  getAllJobs: () => ipcRenderer.invoke('get-all-jobs'),
  cancelJob: (jobId) => ipcRenderer.invoke('cancel-job', jobId),
  
  // Info fetching
  getPlaylistInfo: (url) => ipcRenderer.invoke('get-playlist-info', url),
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),
  getTranscript: (url, language) => ipcRenderer.invoke('get-transcript', url, language),
  
  // File system
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  
  // Event listeners
  onDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.off('download-progress', handler);
  },
});

contextBridge.exposeInMainWorld('api', {
  baseURL: 'http://localhost:3001/api',
  
  // REST API calls
  request: async (endpoint, options = {}) => {
    const response = await fetch(`http://localhost:3001/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  },
  
  // WebSocket connection
  createWebSocket: (jobId) => {
    const ws = new WebSocket(`ws://localhost:3001`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', jobId }));
    };
    return ws;
  },
});