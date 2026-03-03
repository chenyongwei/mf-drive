import React from 'react';
import ReactDOM from 'react-dom/client';
import UniversalCADViewTestPage from './pages/UniversalCADViewTest/UniversalCADViewTestPage';
import './index.css';
import './i18n/i18n';
import { usePreventZoom } from './hooks/usePreventZoom';

const TestApp = () => {
    usePreventZoom();
    return <UniversalCADViewTestPage />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <TestApp />
    </React.StrictMode>
);
