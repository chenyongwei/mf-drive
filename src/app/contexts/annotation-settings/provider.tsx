import React, { useCallback, useEffect, useState } from 'react';

import AnnotationSettingsContext from './context';
import { getApiUrl } from './api';
import {
  DEBOUNCE_MS,
  DEFAULT_SETTINGS,
  LOCAL_STORAGE_KEY,
  type AnnotationSettingsContextValue,
  type AnnotationSettingsProviderProps,
  type DimensionDisplaySettings,
} from './types';

export function AnnotationSettingsProvider({
  children,
  autoSync = true,
}: AnnotationSettingsProviderProps) {
  const [settings, setSettings] = useState<DimensionDisplaySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.dimension_display) {
          setSettings(data.dimension_display);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.dimension_display));
        }
      } else if (response.status === 401 || response.status === 404) {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          try {
            setSettings(JSON.parse(localData));
          } catch {
            // keep defaults
          }
        }
      } else {
        throw new Error(`Failed to load settings: ${response.status}`);
      }
    } catch (loadError) {
      console.error('[AnnotationSettings] Failed to load from server:', loadError);
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          setSettings(JSON.parse(localData));
        } catch {
          console.error('[AnnotationSettings] Failed to parse localStorage data');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [loadSettings]);

  const syncToServer = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dimension_display: settings,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.dimension_display) {
          setSettings(data.dimension_display);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.dimension_display));
        }
      } else if (response.status === 404) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      } else {
        throw new Error(`Failed to sync settings: ${response.status}`);
      }
    } catch (syncError) {
      console.error('[AnnotationSettings] Failed to sync to server:', syncError);
      setError('Failed to sync settings to server');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } finally {
      setIsSyncing(false);
    }
  }, [settings]);

  const syncFromServer = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!autoSync) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToServer();
    }, DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [settings, autoSync, syncToServer]);

  const setShowDimensionsDrawing = useCallback((value: boolean) => {
    setSettings((prev) => ({ ...prev, drawing: value }));
  }, []);

  const setShowDimensionsNesting = useCallback((value: boolean) => {
    setSettings((prev) => ({ ...prev, nesting: value }));
  }, []);

  const toggleDimensionsDrawing = useCallback(() => {
    setSettings((prev) => ({ ...prev, drawing: !prev.drawing }));
  }, []);

  const toggleDimensionsNesting = useCallback(() => {
    setSettings((prev) => ({ ...prev, nesting: !prev.nesting }));
  }, []);

  const value: AnnotationSettingsContextValue = {
    showDimensionsDrawing: settings.drawing,
    showDimensionsNesting: settings.nesting,
    setShowDimensionsDrawing,
    setShowDimensionsNesting,
    toggleDimensionsDrawing,
    toggleDimensionsNesting,
    syncToServer,
    syncFromServer,
    isLoading,
    isSyncing,
    error,
  };

  return (
    <AnnotationSettingsContext.Provider value={value}>
      {children}
    </AnnotationSettingsContext.Provider>
  );
}
