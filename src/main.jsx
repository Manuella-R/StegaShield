// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

console.log('Starting React app initialization...');

// Add fallback rendering in case of errors
try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created successfully');
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(18, 2, 2, 0.92), rgba(61, 14, 14, 0.85)); color: #d4af37; padding: 2rem; text-align: center; font-family: system-ui, sans-serif;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">Failed to Load Application</h1>
        <p style="color: rgba(245, 230, 211, 0.7); margin-bottom: 2rem; max-width: 600px;">
          ${error.message || 'An unexpected error occurred'}
        </p>
        <p style="color: rgba(245, 230, 211, 0.5); margin-bottom: 2rem; font-size: 0.9rem;">
          Check the browser console for more details.
        </p>
        <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background: #d4af37; color: #2b0909; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">
          Reload Page
        </button>
      </div>
    `;
  }
}