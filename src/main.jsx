import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Hide loading screen once React mounts
const loadingScreen = document.getElementById('loading');
if (loadingScreen) {
  loadingScreen.classList.add('hidden');
  // Remove from DOM after transition
  setTimeout(() => loadingScreen.remove(), 300);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);