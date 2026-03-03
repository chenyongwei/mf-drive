import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider, ToastContainer } from './components/common';
import App from './App';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import './i18n/i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <FeatureFlagProvider>
        <ToastProvider>
          <App />
          <ToastContainer />
        </ToastProvider>
      </FeatureFlagProvider>
    </BrowserRouter>
  </React.StrictMode>
);
