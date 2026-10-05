import React, { useState } from 'react';

export function PreviewPanel({ preview }) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const videos = preview.videos || [];
  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayVideos = expanded ? filteredVideos : filteredVideos.slice(0, 10);

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCount = (count) => {
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  if (!preview || videos.length === 0) return null;

  const isPlaylist = preview.type === 'playlist' || preview.type === 'channel';
  const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isPlaylist ? 'bg-blue-500/20' : 'bg-green-500/20'
            }`}>
              {isPlaylist ? (
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zm0 4H3v2h12v-2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4z"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-semibold">{isPlaylist ? 'Playlist' : 'Video'} Preview</h3>
              <p className="text-sm text-[var(--text-muted)]">
                {videos.length} video{videos.length !== 1 ? 's' : ''} • {formatDuration(totalDuration)} total
              </p>
            </div>
          </div>
          
          {videos.length > 10 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              {expanded ? 'Show Less' : `Show All (${videos.length})`}
              <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {videos.length > 10 && (
          <div className="mt-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search videos..."
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm"
            />
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-[var(--border)]">
          {displayVideos.map((video, index) => (
            <div key={video.id} className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors">
              <div className="flex gap-3">
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="w-16 h-9 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{video.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                      </svg>
                      {formatCount(video.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                      {formatDuration(video.duration)}
                    </span>
                    {video.uploader && (
                      <span className="truncate max-w-[150px]">{video.uploader}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-[var(--text-muted)]">
                  <span className="text-sm font-mono">#{index + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredVideos.length !== videos.length && (
        <div className="p-4 border-t border-[var(--border)] text-center text-sm text-[var(--text-muted)]">
          Showing {displayVideos.length} of {filteredVideos.length} filtered videos ({videos.length} total)
        </div>
      )}
    </div>
  );
}