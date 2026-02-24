import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DriveFilesPage } from './features/files/DriveFilesPage';
import './styles.css';

function resolveBasename(): string | undefined {
  const rawBase = import.meta.env.BASE_URL ?? '/';
  if (rawBase === '/' || rawBase.length === 0) {
    return undefined;
  }
  return rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
}

export default function App() {
  return (
    <BrowserRouter basename={resolveBasename()}>
      <Routes>
        <Route path="/" element={<Navigate to="/files" replace />} />
        <Route path="/files" element={<DriveFilesPage />} />
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
