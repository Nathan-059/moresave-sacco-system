import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { NotifyProvider } from './context/NotifyContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Intercept fetch calls to rewrite local /api requests to production server when deployed
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = input;
  if (typeof input === 'string' && input.startsWith('/api')) {
    const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://moresave-sacco-system-production.up.railway.app');
    url = `${apiBase}${input}`;
  }
  return originalFetch(url, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <NotifyProvider>
        <App />
      </NotifyProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
