import React, { useState, useRef, useEffect } from 'react';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { FormatOptions } from './FormatOptions';
import { AdvancedOptions } from './AdvancedOptions';
import { PreviewPanel } from './PreviewPanel';

const inBrowser =
  typeof window !== 'undefined' && !window.electronAPI;

export function DownloadForm({ onJobCreated }) {
  const { selectDirectory, getPlaylistInfo, getVideoInfo, startDownload } = useElectronAPI();

  // Form state
  const [url, setUrl] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [format, setFormat] = useState('audio'); // 'audio' | 'video'
  const [quality, setQuality] = useState('1080');
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [audioQuality, setAudioQuality] = useState('0');
  const [advancedOptions, setAdvancedOptions] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [detectedType, setDetectedType] = useState(null); // 'playlist' | 'video' | 'channel'
  const [fetchingPreview, setFetchingPreview] = useState(false);

  const urlInputRef = useRef(null);

  // Auto-detect URL type and fetch preview
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!url.trim()) {
        setPreview(null);
        setDetectedType(null);
        return;
      }

      setFetchingPreview(true);
      setError(null);

      try {
        // Detect if playlist or video
        const isPlaylist = url.includes('list=') || url.includes('/playlist');
        const isChannel = url.includes('/channel/') || url.includes('/c/') || url.includes('/@');

        if (isPlaylist) {
          setDetectedType('playlist');
          const info = await getPlaylistInfo(url);
          setPreview({ type: 'playlist', ...info });
        } else if (isChannel) {
          setDetectedType('channel');
          // For channels, treat as playlist
          const info = await getPlaylistInfo(url);
          setPreview({ type: 'channel', ...info });
        } else {
          setDetectedType('video');
          const info = await getVideoInfo(url);
          setPreview({ type: 'video', ...info });
        }
      } catch (err) {
        console.error('Preview fetch error:', err);
        // Don't show error for preview, just clear it
        setPreview(null);
      } finally {
        setFetchingPreview(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url, getPlaylistInfo, getVideoInfo]);

  const handleSelectDirectory = async () => {
    const dir = await selectDirectory();
    if (dir) setOutputDir(dir);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!outputDir) {
      setError('Please select an output directory');
      return;
    }

    setLoading(true);

    try {
      const options = {
        url: url.trim(),
        outputDir,
        format,
        quality,
        audioFormat,
        audioQuality,
        ...advancedOptions,
      };

      await startDownload(options);
      onJobCreated();
      setUrl('');
      setPreview(null);
      setDetectedType(null);
    } catch (err) {
      setError(err.message || 'Failed to start download');
    } finally {
      setLoading(false);
    }
  };

  const formatOptions = {
    format,
    setFormat,
    quality,
    setQuality,
    audioFormat,
    setAudioFormat,
    audioQuality,
    setAudioQuality,
  };

  const canSubmit = !loading && url.trim() && outputDir;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3.5 text-sm text-error animate-fade-in" role="alert">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1 — Source */}
      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="step-badge">1</span>
          <h3 className="section-title">Source</h3>
          {detectedType && (
            <span
              className={`pill ml-auto ${
                detectedType === 'playlist'
                  ? 'bg-blue-500/15 text-blue-400'
                  : detectedType === 'channel'
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'bg-success/15 text-success'
              }`}
            >
              {detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}
              {preview && preview.total > 0 && (
                <span className="opacity-80">· {preview.total} video{preview.total !== 1 ? 's' : ''}</span>
              )}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a YouTube playlist, video, or channel URL…"
              className="input pl-10 pr-10"
              disabled={loading}
              spellCheck={false}
            />
            {fetchingPreview && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-label="Loading preview">
                <svg className="h-4 w-4 animate-spin text-accent" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Step 2 — Destination */}
      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="step-badge">2</span>
          <h3 className="section-title">Destination</h3>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            placeholder="Download folder — e.g. /tmp/downloads"
            className="input flex-1 font-mono text-[13px]"
            spellCheck={false}
          />
          <button type="button" onClick={handleSelectDirectory} className="btn-ghost shrink-0">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Browse
          </button>
        </div>
        {inBrowser && (
          <p className="mt-2 text-xs leading-relaxed text-warning">
            Browser mode has no native folder picker — type a folder path that exists on the machine running the API server.
          </p>
        )}
        <p className="mt-2.5 truncate font-mono text-[11px] text-muted">
          <span className="text-accent">{outputDir || '…/downloads'}</span>
          <span> / Playlist Name / Video Title.mp3</span>
        </p>
      </section>

      {/* Step 3 — Format */}
      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="step-badge">3</span>
          <h3 className="section-title">Format</h3>
        </div>
        <FormatOptions {...formatOptions} bare />
      </section>

      {/* Advanced */}
      <section className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center gap-2.5 p-5 text-left transition-colors hover:bg-base-tertiary/50"
          aria-expanded={showAdvanced}
        >
          <svg className={`h-4 w-4 text-muted transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-sm font-semibold">Advanced options</span>
          <span className="ml-auto text-xs text-muted">metadata · subtitles · filters · retries</span>
        </button>
        {showAdvanced && (
          <div className="border-t border-line p-5 pt-4 animate-fade-in">
            <AdvancedOptions options={advancedOptions} onChange={setAdvancedOptions} bare />
          </div>
        )}
      </section>

      {preview && <PreviewPanel preview={preview} />}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="btn-primary w-full py-3.5 text-[15px] shadow-glow"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting download…
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Start download
          </>
        )}
      </button>
    </div>
  );
}
