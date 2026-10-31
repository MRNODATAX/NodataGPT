import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { installSameOriginApiShield } from './services/accessGate';
import App from './App';

installSameOriginApiShield();

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
