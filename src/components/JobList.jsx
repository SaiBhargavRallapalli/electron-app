import React, { useState, useEffect } from 'react';
import { useElectronAPI, fileUrl } from '../hooks/useElectronAPI';

function formatBytes(bytes) {
  if (bytes == null) return '';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const baseName = (p) => String(p || '').split(/[\\/]/).pop();

export function JobList({ jobs, onRefresh }) {
  const { cancelJob, openFolder, getJob } = useElectronAPI();
  const [selectedJob, setSelectedJob] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(onRefresh, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms) => {
    if (!ms) return '—';
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-[var(--success)]';
      case 'running': return 'text-[var(--accent)]';
      case 'error': return 'text-[var(--error)]';
      case 'cancelled': return 'text-[var(--warning)]';
      default: return 'text-[var(--text-muted)]';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>;
      case 'running':
        return <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>;
      case 'error':
        return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>;
      case 'cancelled':
        return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>;
      default:
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
    }
  };

  const runningJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const errorJobs = jobs.filter(j => j.status === 'error' || j.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Running</p>
              <p className="text-2xl font-bold">{runningJobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--success)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Completed</p>
              <p className="text-2xl font-bold">{completedJobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--error)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--error)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Failed</p>
              <p className="text-2xl font-bold">{errorJobs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">Download History</h2>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-primary)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Auto-refresh
          </label>
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p className="mt-4 text-[var(--text-secondary)]">No downloads yet</p>
            <p className="text-sm text-[var(--text-muted)]">Start by adding a YouTube URL in the Download tab</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onCancel={() => cancelJob(job.id)}
                onOpenFolder={() => openFolder(job.options.outputDir)}
                onRefresh={onRefresh}
                onClick={() => setSelectedJob(job.id === selectedJob ? null : job.id)}
                isSelected={selectedJob === job.id}
                formatTime={formatTime}
                formatDuration={formatDuration}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobRow({ job, onCancel, onOpenFolder, onRefresh, onClick, isSelected, formatTime, formatDuration, getStatusColor, getStatusIcon }) {
  const { isBrowser, clearServerFiles } = useElectronAPI();
  const [clearing, setClearing] = useState(false);
  const progress = job.progress || 0;
  const isRunning = job.status === 'running' || job.status === 'pending';

  const handleClearServerFiles = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete all staged files for this job from the server? (Your local copies are unaffected.)')) return;
    setClearing(true);
    try {
      await clearServerFiles(job.id);
      onRefresh();
    } catch (err) {
      alert(`Failed to clear server files: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`p-4 cursor-pointer transition-colors ${
          isSelected ? 'bg-[var(--accent)]/10' : 'hover:bg-[var(--bg-tertiary)]'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${getStatusColor(job.status)}`}>
            {getStatusIcon(job.status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate max-w-[300px]">
                  {job.options.url}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(job.status)} bg-current/10`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span>Started: {formatTime(job.startTime)}</span>
                {job.endTime && <span>Ended: {formatTime(job.endTime)}</span>}
                {job.endTime && <span>({formatDuration(job.endTime - job.startTime)})</span>}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span>Format: {job.options.format}</span>
              {job.options.format === 'video' && <span>Quality: {job.options.quality}p</span>}
              <span>Audio: {job.options.audioFormat?.toUpperCase() || 'MP3'}</span>
            </div>

            {isRunning && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span className={getStatusColor(job.status)} font-mono>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {job.error && (
              <div className="mt-2 p-2 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
                {job.error}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                className="px-3 py-1.5 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            {job.status === 'completed' && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenFolder(); }}
                className="px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
              >
                Open Folder
              </button>
            )}
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="px-4 pb-4 bg-[var(--bg-primary)] border-t border-[var(--border)] animate-fade-in">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-muted)]">Output Directory</p>
              <p className="font-mono text-xs truncate">{job.options.outputDir}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Items Completed</p>
              <p>{job.items?.length || 0} / {job.total || '?'}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Options</p>
              <p className="font-mono text-xs truncate">
                {JSON.stringify({ 
                  format: job.options.format, 
                  quality: job.options.quality,
                  audioFormat: job.options.audioFormat,
                  embedMetadata: job.options.embedMetadata,
                  writeSubtitles: job.options.writeSubtitles,
                })}
              </p>
            </div>
          </div>
          
          {job.items && job.items.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[var(--text-muted)] text-sm">
                  Downloaded Files
                  {isBrowser && (
                    <span className="text-xs"> (staging on server — save locally, then clear)</span>
                  )}:
                </p>
                {isBrowser && (
                  <button
                    onClick={handleClearServerFiles}
                    disabled={clearing}
                    className="px-3 py-1.5 text-xs text-[var(--warning)] hover:bg-[var(--warning)]/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {clearing ? 'Clearing…' : 'Clear server files'}
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {job.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 shrink-0 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-mono text-xs truncate flex-1" title={item.file}>
                      {baseName(item.file)}
                      {item.size != null && (
                        <span className="text-[var(--text-muted)]"> · {formatBytes(item.size)}</span>
                      )}
                      {item.onServer === false && (
                        <span className="text-[var(--warning)]"> · removed from server</span>
                      )}
                    </span>
                    {isBrowser && item.onServer !== false && (
                      <a
                        href={fileUrl(job.id, i)}
                        download={baseName(item.file)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 px-3 py-1 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                        title="Save this file to your device"
                      >
                        Save
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}