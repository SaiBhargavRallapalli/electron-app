import { useState, useEffect, useCallback } from 'react';

const DEFAULT_SETTINGS = {
  // Download defaults
  defaultFormat: 'audio',
  defaultQuality: '1080',
  defaultAudioFormat: 'mp3',
  defaultAudioQuality: '0',
  defaultOutputDir: '',
  
  // Behavior
  autoOpenFolder: true,
  showNotifications: true,
  minimizeToTray: false,
  startMinimized: false,
  
  // Advanced defaults
  concurrentDownloads: 1,
  maxConcurrentFragments: 4,
  defaultRetries: 10,
  ignoreErrorsByDefault: false,
  continuePartialByDefault: true,
};

const STORAGE_KEY = 'youtube-downloader-settings';

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  const updateSettings = useCallback((updater) => {
    setSettings(prev => {
      const newSettings = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'youtube-downloader-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [settings]);

  const importSettings = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          const merged = { ...DEFAULT_SETTINGS, ...imported };
          setSettings(merged);
          resolve(merged);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  };
}