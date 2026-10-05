import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

const isElectron = () =>
  typeof window !== 'undefined' && !!window.electronAPI;

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(endpoint, body = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useElectronAPI() {
  const selectDirectory = useCallback(async () => {
    if (isElectron()) {
      return window.electronAPI.selectDirectory();
    }
    // No native dialog in plain browser — user types/pastes the path manually.
    return null;
  }, []);

  const startDownload = useCallback(async (options) => {
    if (isElectron()) {
      return window.electronAPI.startDownload(options);
    }
    const job = await apiPost('/jobs', options);
    return job.id;
  }, []);

  const getJob = useCallback(async (jobId) => {
    if (isElectron()) {
      return window.electronAPI.getJob(jobId);
    }
    return apiGet(`/jobs/${jobId}`);
  }, []);

  const getAllJobs = useCallback(async () => {
    if (isElectron()) {
      return window.electronAPI.getAllJobs();
    }
    return apiGet('/jobs');
  }, []);

  const cancelJob = useCallback(async (jobId) => {
    if (isElectron()) {
      return window.electronAPI.cancelJob(jobId);
    }
    return apiPost(`/jobs/${jobId}/cancel`, {});
  }, []);

  const getPlaylistInfo = useCallback(async (url) => {
    if (isElectron()) {
      return window.electronAPI.getPlaylistInfo(url);
    }
    return apiPost('/playlist/info', { url });
  }, []);

  const getVideoInfo = useCallback(async (url) => {
    if (isElectron()) {
      return window.electronAPI.getVideoInfo(url);
    }
    return apiPost('/video/info', { url });
  }, []);

  const getTranscript = useCallback(async (url, language) => {
    if (isElectron()) {
      return window.electronAPI.getTranscript(url, language);
    }
    return apiPost('/transcript', { url, language });
  }, []);

  const openFolder = useCallback(async (folderPath) => {
    if (isElectron()) {
      return window.electronAPI.openFolder(folderPath);
    }
    // No shell access in browser — just log it.
    console.info('Download folder (server-side path):', folderPath);
    return null;
  }, []);

  return {
    isBrowser: !isElectron(),
    selectDirectory,
    startDownload,
    getJob,
    getAllJobs,
    cancelJob,
    getPlaylistInfo,
    getVideoInfo,
    getTranscript,
    openFolder,
  };
}

// REST API hook
export function useAPI() {
  const baseURL = 'http://localhost:3001/api';

  const request = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }, [baseURL]);

  const getJobs = useCallback(() => request('/jobs'), [request]);
  const getJob = useCallback((id) => request(`/jobs/${id}`), [request]);
  const createJob = useCallback((options) => request('/jobs', { method: 'POST', body: JSON.stringify(options) }), [request]);
  const cancelJob = useCallback((id) => request(`/jobs/${id}/cancel`, { method: 'POST' }), [request]);
  const deleteJob = useCallback((id) => request(`/jobs/${id}`, { method: 'DELETE' }), [request]);

  const getPlaylistInfo = useCallback((url) => request('/playlist/info', { method: 'POST', body: JSON.stringify({ url }) }), [request]);
  const getVideoInfo = useCallback((url) => request('/video/info', { method: 'POST', body: JSON.stringify({ url }) }), [request]);
  const getTranscript = useCallback((url, language) => request('/transcript', { method: 'POST', body: JSON.stringify({ url, language }) }), [request]);
  const getFormats = useCallback((url) => request('/formats', { method: 'POST', body: JSON.stringify({ url }) }), [request]);
  const directDownload = useCallback((options) => request('/download', { method: 'POST', body: JSON.stringify(options) }), [request]);
  const getSystemInfo = useCallback(() => request('/system/info'), [request]);

  return {
    request,
    getJobs,
    getJob,
    createJob,
    cancelJob,
    deleteJob,
    getPlaylistInfo,
    getVideoInfo,
    getTranscript,
    getFormats,
    directDownload,
    getSystemInfo,
  };
}

// WebSocket hook
export function useWebSocket(jobId) {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      setConnected(true);
      websocket.send(JSON.stringify({ type: 'subscribe', jobId }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };

    websocket.onclose = () => {
      setConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [jobId]);

  const send = useCallback((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, [ws]);

  return { ws, connected, lastMessage, send };
}
