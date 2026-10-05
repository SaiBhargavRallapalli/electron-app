import React, { useState, useEffect } from 'react';
import { useElectronAPI } from '../hooks/useElectronAPI';

export function SettingsPanel({ settings, onUpdate }) {
  const { selectDirectory } = useElectronAPI();
  const [systemInfo, setSystemInfo] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/system/info');
      const data = await res.json();
      setSystemInfo(data);
    } catch (err) {
      console.error('Failed to fetch system info:', err);
    }
  };

  const handleTestYtDlp = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('http://localhost:3001/api/video/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' }),
      });
      const data = await res.json();
      setTestResult({ success: true, data });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const settingGroups = [
    {
      title: 'Default Download Settings',
      fields: [
        { key: 'defaultFormat', label: 'Default Format', type: 'select', options: [
          { value: 'audio', label: 'Audio Only (MP3)' },
          { value: 'video', label: 'Video + Audio (MP4)' },
        ]},
        { key: 'defaultQuality', label: 'Default Video Quality', type: 'select', options: [
          { value: '4320', label: '4320p (8K)' },
          { value: '2160', label: '2160p (4K)' },
          { value: '1440', label: '1440p (2K)' },
          { value: '1080', label: '1080p (Full HD)' },
          { value: '720', label: '720p (HD)' },
          { value: '480', label: '480p (SD)' },
        ]},
        { key: 'defaultAudioFormat', label: 'Default Audio Format', type: 'select', options: [
          { value: 'mp3', label: 'MP3' },
          { value: 'm4a', label: 'M4A' },
          { value: 'opus', label: 'OPUS' },
          { value: 'flac', label: 'FLAC' },
        ]},
        { key: 'defaultAudioQuality', label: 'Default Audio Quality', type: 'select', options: [
          { value: '0', label: 'Best (VBR)' },
          { value: '5', label: 'VBR ~165 kbps' },
          { value: '3', label: 'VBR ~225 kbps' },
        ]},
      ]
    },
    {
      title: 'Default Output Directory',
      fields: [
        { key: 'defaultOutputDir', label: 'Default Folder', type: 'directory' },
      ]
    },
    {
      title: 'Behavior',
      fields: [
        { key: 'autoOpenFolder', label: 'Open folder after download', type: 'checkbox' },
        { key: 'showNotifications', label: 'Show desktop notifications', type: 'checkbox' },
        { key: 'minimizeToTray', label: 'Minimize to system tray', type: 'checkbox' },
        { key: 'startMinimized', label: 'Start minimized', type: 'checkbox' },
      ]
    },
    {
      title: 'Advanced',
      fields: [
        { key: 'concurrentDownloads', label: 'Max Concurrent Downloads', type: 'number', min: 1, max: 5, step: 1 },
        { key: 'maxConcurrentFragments', label: 'Max Concurrent Fragments', type: 'number', min: 1, max: 16, step: 1 },
        { key: 'defaultRetries', label: 'Default Retry Count', type: 'number', min: 1, max: 50, step: 1 },
        { key: 'ignoreErrorsByDefault', label: 'Ignore Errors by Default', type: 'checkbox' },
        { key: 'continuePartialByDefault', label: 'Resume Partial Downloads by Default', type: 'checkbox' },
      ]
    },
  ];

  const updateSetting = (key, value) => {
    onUpdate(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* System Info */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          System Information
        </h2>
        
        {systemInfo && (
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-[var(--text-muted)]">Python</p>
              <p className="font-mono text-xs truncate">{systemInfo.python}</p>
            </div>
            <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-[var(--text-muted)]">yt-dlp</p>
              <p className="font-mono text-xs truncate">{systemInfo.ytDlp}</p>
            </div>
            <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-[var(--text-muted)]">Platform</p>
              <p className="font-mono text-xs">{systemInfo.platform} ({systemInfo.arch})</p>
            </div>
            <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-[var(--text-muted)]">Node.js</p>
              <p className="font-mono text-xs">{systemInfo.nodeVersion}</p>
            </div>
            <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-[var(--text-muted)]">API Server</p>
              <p className="font-mono text-xs">http://localhost:3001</p>
            </div>
            <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-[var(--text-muted)]">WebSocket</p>
              <p className="font-mono text-xs">ws://localhost:3001</p>
            </div>
          </div>
        )}

        <button
          onClick={handleTestYtDlp}
          disabled={testing}
          className="mt-4 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {testing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Testing yt-dlp...
            </>
          ) : (
            'Test yt-dlp Installation'
          )}
        </button>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-[var(--success)]/10 border border-[var(--success)]/20' : 'bg-[var(--error)]/10 border border-[var(--error)]/20'}`}>
            {testResult.success ? (
              <p className="text-[var(--success)] text-sm">
                ✓ yt-dlp working! Test video: {testResult.data.title}
              </p>
            ) : (
              <p className="text-[var(--error)] text-sm">
                ✗ Test failed: {testResult.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Settings Groups */}
      {settingGroups.map((group) => (
        <div key={group.title} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold mb-4">{group.title}</h3>
          
          <div className="space-y-4">
            {group.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {field.label}
                </label>
                
                {field.type === 'select' && (
                  <select
                    value={settings[field.key] || field.options[0].value}
                    onChange={(e) => updateSetting(field.key, e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[field.key] || false}
                      onChange={(e) => updateSetting(field.key, e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-primary)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                    />
                    <span className="text-[var(--text-primary)]">{field.label}</span>
                  </label>
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={settings[field.key] || ''}
                    onChange={(e) => updateSetting(field.key, parseInt(e.target.value) || undefined)}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className="w-full max-w-xs px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                )}

                {field.type === 'directory' && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={settings[field.key] || ''}
                      readOnly
                      className="flex-1 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)]"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const dir = await selectDirectory();
                        if (dir) updateSetting(field.key, dir);
                      }}
                      className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors"
                    >
                      Browse
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* API Documentation */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          REST API Endpoints
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          The API server runs at <code className="bg-[var(--bg-primary)] px-1.5 py-0.5 rounded text-[var(--accent)]">http://localhost:3001/api</code>
        </p>
        
        <div className="space-y-2 text-sm font-mono">
          {[
            ['GET', '/health', 'Health check'],
            ['GET', '/jobs', 'List all download jobs'],
            ['GET', '/jobs/:id', 'Get job details'],
            ['POST', '/jobs', 'Create new download job'],
            ['POST', '/jobs/:id/cancel', 'Cancel a job'],
            ['DELETE', '/jobs/:id', 'Delete a job'],
            ['POST', '/playlist/info', 'Get playlist info'],
            ['POST', '/video/info', 'Get video info'],
            ['POST', '/transcript', 'Get video transcript'],
            ['POST', '/formats', 'Get available formats'],
            ['POST', '/download', 'Direct download'],
            ['GET', '/system/info', 'System information'],
          ].map(([method, path, desc]) => (
            <div key={path} className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-primary)] rounded-lg">
              <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                method === 'GET' ? 'bg-green-500/20 text-green-400' :
                method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {method}
              </span>
              <code className="text-[var(--accent)] flex-1">{path}</code>
              <span className="text-[var(--text-muted)]">{desc}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <h4 className="font-medium mb-2">WebSocket</h4>
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Connect to <code className="bg-[var(--bg-primary)] px-1.5 py-0.5 rounded text-[var(--accent)]">ws://localhost:3001</code>
          </p>
          <pre className="bg-[var(--bg-primary)] p-3 rounded-lg text-xs overflow-x-auto text-[var(--text-secondary)]">
{`// Subscribe to job updates
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'subscribe', jobId: 'YOUR_JOB_ID' }));
};
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Job update:', data);
};`}
          </pre>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            // Settings are auto-saved via onUpdate
            alert('Settings saved!');
          }}
          className="px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}