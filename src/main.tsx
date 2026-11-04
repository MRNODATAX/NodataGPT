import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { installSameOriginApiShield } from './services/accessGate';
import App from './App';

installSameOriginApiShield();

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
  const triggerSwUpdate = () => {
    void navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.update())
      .catch(() => undefined);
  };
  window.addEventListener('load', triggerSwUpdate, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerSwUpdate();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
