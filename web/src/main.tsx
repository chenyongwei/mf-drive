import React from 'react';
import ReactDOM from 'react-dom/client';
import '@platform/ui-shared/bootstrap';
import { initMfThemeSync } from '@platform/ui-shared/mf-theme';
import App from './App';

initMfThemeSync({ appId: 'drive' });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
