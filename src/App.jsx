import React, { useState, useEffect } from 'react';
import { DownloadForm } from './components/DownloadForm';
import { JobList } from './components/JobList';
import { SettingsPanel } from './components/SettingsPanel';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { useDownloads } from './hooks/useDownloads';
import { useSettings } from './hooks/useSettings';

const TITLES = {
  download: { title: 'New download', sub: 'Paste a link, pick a format, and go.' },
  jobs: { title: 'Downloads', sub: 'Track progress and history across jobs.' },
  settings: { title: 'Settings', sub: 'Defaults, behavior, and API reference.' },
};

function App() {
  const [activeTab, setActiveTab] = useState('download');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { jobs, refreshJobs } = useDownloads();

  useEffect(() => {
    refreshJobs();
    const interval = setInterval(refreshJobs, 5000);
    return () => clearInterval(interval);
  }, [refreshJobs]);

  const running = jobs.filter((j) => j.status === 'running' || j.status === 'pending').length;
  const meta = TITLES[activeTab];

  return (
    <div className="flex min-h-screen bg-base text-white">
      <Sidebar
        open={sidebarOpen}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
        runningCount={running}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          runningCount={running}
        />

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 animate-fade-in">
            <h2 className="text-xl font-bold tracking-tight">{meta.title}</h2>
            <p className="mt-0.5 text-sm text-muted">{meta.sub}</p>
          </div>

          <div key={activeTab} className="animate-fade-in">
            {activeTab === 'download' && <DownloadForm onJobCreated={refreshJobs} />}
            {activeTab === 'jobs' && <JobList jobs={jobs} onRefresh={refreshJobs} />}
            {activeTab === 'settings' && <SettingsPanel settings={settings} onUpdate={updateSettings} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
