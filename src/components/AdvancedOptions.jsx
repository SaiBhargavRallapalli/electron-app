import React from 'react';

export function AdvancedOptions({ options, onChange, bare = false }) {
  const updateOption = (key, value) => {
    onChange(prev => ({ ...prev, [key]: value }));
  };

  const sections = [
    {
      title: 'Metadata & Thumbnails',
      fields: [
        { key: 'embedMetadata', label: 'Embed Metadata', type: 'checkbox', desc: 'Write title, artist, album, etc. to audio file' },
        { key: 'embedThumbnail', label: 'Embed Thumbnail', type: 'checkbox', desc: 'Embed video thumbnail as cover art' },
        { key: 'writeThumbnail', label: 'Save Thumbnail', type: 'checkbox', desc: 'Save thumbnail as separate JPG file' },
      ]
    },
    {
      title: 'Subtitles & Transcripts',
      fields: [
        { key: 'writeSubtitles', label: 'Download Subtitles', type: 'checkbox', desc: 'Download available subtitles/closed captions' },
        { 
          key: 'subtitleLanguages', 
          label: 'Subtitle Languages', 
          type: 'text', 
          placeholder: 'en,es,fr (comma-separated)',
          desc: 'Leave empty for all available languages',
          dependsOn: 'writeSubtitles'
        },
      ]
    },
    {
      title: 'Playlist Filtering',
      fields: [
        { key: 'playlistStart', label: 'Start Index', type: 'number', placeholder: '1', desc: 'Start from this video in playlist (1-based)' },
        { key: 'playlistEnd', label: 'End Index', type: 'number', placeholder: '', desc: 'End at this video in playlist (inclusive)' },
        { key: 'playlistItems', label: 'Specific Items', type: 'text', placeholder: '1,3,5-10', desc: 'Comma-separated indices or ranges (e.g., 1,3,5-10)' },
        { key: 'maxDownloads', label: 'Max Downloads', type: 'number', placeholder: '', desc: 'Maximum number of videos to download' },
        { key: 'dateAfter', label: 'Date After', type: 'text', placeholder: 'YYYYMMDD', desc: 'Only download videos uploaded after this date' },
        { key: 'dateBefore', label: 'Date Before', type: 'text', placeholder: 'YYYYMMDD', desc: 'Only download videos uploaded before this date' },
        { key: 'matchTitle', label: 'Match Title', type: 'text', placeholder: 'regex pattern', desc: 'Download only videos matching this regex' },
        { key: 'rejectTitle', label: 'Reject Title', type: 'text', placeholder: 'regex pattern', desc: 'Skip videos matching this regex' },
      ]
    },
    {
      title: 'Network & Performance',
      fields: [
        { key: 'concurrent', label: 'Concurrent Fragments', type: 'number', placeholder: '4', desc: 'Number of concurrent download fragments (1-16)' },
        { key: 'retries', label: 'Retry Count', type: 'number', placeholder: '10', desc: 'Number of retries for failed downloads' },
        { key: 'ignoreErrors', label: 'Ignore Errors', type: 'checkbox', desc: 'Continue downloading on download errors' },
        { key: 'noOverwrites', label: 'No Overwrites', type: 'checkbox', desc: 'Do not overwrite existing files' },
        { key: 'continueDl', label: 'Resume Partial', type: 'checkbox', desc: 'Resume partially downloaded files' },
      ]
    },
  ];

  const inner = (
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              {section.title}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {section.fields.map((field) => {
                const disabled = field.dependsOn && !options[field.dependsOn];
                const value = options[field.key] ?? '';
                
                return (
                  <div 
                    key={field.key} 
                    className={disabled ? 'opacity-50' : ''}
                    style={{ display: field.type === 'checkbox' && !field.dependsOn ? 'flex' : 'block' }}
                  >
                    {field.type === 'checkbox' ? (
                      <label className="flex items-center gap-3 cursor-pointer w-full">
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => updateOption(field.key, e.target.checked)}
                          disabled={disabled}
                          className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-primary)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2 transition-colors"
                        />
                        <div>
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-[var(--text-muted)]">{field.desc}</div>
                        </div>
                      </label>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(e) => updateOption(field.key, e.target.value)}
                          disabled={disabled}
                          className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        />
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{field.desc}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
  );

  if (bare) return inner;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 animate-fade-in">
      {inner}
    </div>
  );
}