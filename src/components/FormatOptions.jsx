import React from 'react';

export function FormatOptions({ format, setFormat, quality, setQuality, audioFormat, setAudioFormat, audioQuality, setAudioQuality, bare = false }) {
  const inner = (
    <>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          Download Format
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'audio', label: 'Audio Only (MP3)', desc: 'Extract audio only', icon: AudioIcon },
            { id: 'video', label: 'Video + Audio (MP4)', desc: 'Download video with audio', icon: VideoIcon },
          ].map((opt) => {
            const Icon = opt.icon;
            return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFormat(opt.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                format === opt.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  format === opt.id ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
                }`}>
                  <span className={`w-5 h-5 ${format === opt.id ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                </div>
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm text-[var(--text-muted)]">{opt.desc}</div>
                </div>
              </div>
            </button>
            );
          })}
        </div>
      </div>

      {/* Audio Quality Options (shown for both audio and video) */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Audio Format
          </label>
          <select
            value={audioFormat}
            onChange={(e) => setAudioFormat(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <option value="mp3">MP3 (Most compatible)</option>
            <option value="m4a">M4A (Better quality/size)</option>
            <option value="opus">OPUS (Best quality/size)</option>
            <option value="flac">FLAC (Lossless)</option>
            <option value="wav">WAV (Uncompressed)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Audio Quality
          </label>
          <select
            value={audioQuality}
            onChange={(e) => setAudioQuality(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <option value="0">Best (VBR ~245 kbps)</option>
            <option value="9">VBR ~65 kbps</option>
            <option value="8">VBR ~85 kbps</option>
            <option value="7">VBR ~100 kbps</option>
            <option value="6">VBR ~130 kbps</option>
            <option value="5">VBR ~165 kbps</option>
            <option value="4">VBR ~195 kbps</option>
            <option value="3">VBR ~225 kbps</option>
            <option value="2">VBR ~265 kbps</option>
            <option value="1">VBR ~310 kbps</option>
          </select>
        </div>
      </div>

      {/* Video Quality (only for video format) */}
      {format === 'video' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Video Quality
          </label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <option value="4320">4320p (8K)</option>
            <option value="2160">2160p (4K)</option>
            <option value="1440">1440p (2K)</option>
            <option value="1080">1080p (Full HD)</option>
            <option value="720">720p (HD)</option>
            <option value="480">480p (SD)</option>
            <option value="360">360p</option>
            <option value="240">240p</option>
            <option value="144">144p</option>
          </select>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Video will be saved as MP4. Audio will also be extracted as {audioFormat.toUpperCase()}.
          </p>
        </div>
      )}
    </>
  );

  if (bare) return inner;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <svg className="h-5 w-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Format &amp; Quality
      </h2>
      {inner}
    </div>
  );
}

function AudioIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1a1 1 0 011 1v3.586l1.707-1.707a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414L4.172 13.586a1 1 0 011.414-1.414z" />
    </svg>
  );
}

function VideoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}