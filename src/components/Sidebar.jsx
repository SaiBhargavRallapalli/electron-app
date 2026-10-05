import React from 'react';

function DownloadIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function JobsIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function SettingsIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const TABS = [
  { id: 'download', label: 'Download', hint: 'New job', Icon: DownloadIcon },
  { id: 'jobs', label: 'Jobs', hint: 'History', Icon: JobsIcon },
  { id: 'settings', label: 'Settings', hint: 'Setup', Icon: SettingsIcon },
];

export function Sidebar({ open, activeTab, onTabChange, onClose, runningCount = 0 }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-base-secondary transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.498 6.186a3.167 3.167 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.167 3.167 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.167 3.167 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.167 3.167 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </span>
          <p className="text-sm font-bold tracking-tight">TubeFetch</p>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-muted hover:bg-base-tertiary hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Workspace
          </p>
          {TABS.map(({ id, label, hint, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? 'bg-accent-soft font-semibold text-white'
                    : 'text-muted hover:bg-base-tertiary hover:text-white'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    active ? 'bg-accent text-white' : 'bg-base-tertiary text-muted group-hover:text-white'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1">
                  <span className="block leading-tight">{label}</span>
                  <span className="block text-[11px] font-normal text-muted">{hint}</span>
                </span>
                {id === 'jobs' && runningCount > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
                    {runningCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="rounded-lg border border-line bg-base p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="font-medium text-white">Engine ready</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              yt-dlp powered
              <br />
              API <span className="font-mono text-[#c9c9c9]">localhost:3001</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
