import React from 'react';

export function Header({ onMenuClick, runningCount = 0 }) {
  const inElectron =
    typeof window !== 'undefined' && !!window.electronAPI;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-base/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-base-tertiary hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-glow">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.498 6.186a3.167 3.167 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.167 3.167 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.167 3.167 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.167 3.167 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">TubeFetch</p>
            <p className="hidden text-[11px] text-muted sm:block">Playlist & video downloader</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {runningCount > 0 && (
            <span className="pill bg-accent-soft text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              {runningCount} running
            </span>
          )}
          <span className="pill border border-line bg-base-tertiary text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            API :3001
          </span>
          <span
            className={`pill hidden border sm:inline-flex ${
              inElectron
                ? 'border-line bg-base-tertiary text-muted'
                : 'border-warning/30 bg-warning/10 text-warning'
            }`}
            title={inElectron ? 'Running inside the desktop app' : 'Running in a plain browser — type server-side paths manually'}
          >
            {inElectron ? 'Desktop' : 'Browser'}
          </span>
        </div>
      </div>
    </header>
  );
}
