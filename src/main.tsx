// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Ensure night/dark mode is completely disabled
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
}

// Permanently purge any legacy cached tasks/assignments from user browser storage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const keysToPurge = [
      'genmitra_intern_tasks_state',
      'genmitra_assignments_state',
      'genmitra_admin_task_overrides',
      'genmitra_demo_tasks',
      'genmitra_mock_tasks',
    ];
    keysToPurge.forEach((k) => localStorage.removeItem(k));
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('genmitra_task_submissions_') || k.startsWith('genmitra_task_events_'))) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
