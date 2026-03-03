import React, { type ComponentType } from "react";
import ReactDOM from "react-dom/client";

interface WorkerModule {
  worker: {
    start: (options: {
      onUnhandledRequest: "bypass";
      serviceWorker: { url: string };
    }) => Promise<unknown>;
  };
}

interface EnableMockWorkerOptions {
  compatMode?: string;
  apiMode?: string;
  apiSource?: string;
  allowedApiSources?: string[];
  baseUrl?: string;
  loadWorker: () => Promise<WorkerModule>;
}

interface BootWebAppOptions extends EnableMockWorkerOptions {
  rootElementId?: string;
}

export function resolveBasename(rawBaseUrl: string | undefined | null): string | undefined {
  const baseUrl = rawBaseUrl ?? "/";
  if (baseUrl === "/" || baseUrl.length === 0) {
    return undefined;
  }
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function shouldEnableMockWorker({
  compatMode,
  apiMode,
  apiSource,
  allowedApiSources = [],
}: Pick<EnableMockWorkerOptions, "compatMode" | "apiMode" | "apiSource" | "allowedApiSources">): boolean {
  if (apiMode === "mock") {
    return true;
  }

  if (typeof apiSource === "string" && apiSource.trim().length > 0) {
    const normalizedSource = apiSource.trim().toLowerCase();
    return allowedApiSources.includes(normalizedSource);
  }

  return (compatMode ?? "msw").trim().toLowerCase() === "msw";
}

export async function enableMockWorker(options: EnableMockWorkerOptions): Promise<void> {
  if (!shouldEnableMockWorker(options)) {
    return;
  }

  const { worker } = await options.loadWorker();
  const baseUrl = options.baseUrl ?? "/";
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: `${baseUrl}mockServiceWorker.js`,
    },
  });
}

export function mountReactApp(AppComponent: ComponentType, rootElementId = "root"): void {
  const rootElement = document.getElementById(rootElementId);
  if (!rootElement) {
    throw new Error(`root element '${rootElementId}' was not found`);
  }
  ReactDOM.createRoot(rootElement).render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(AppComponent),
    ),
  );
}

export async function bootWebApp(
  AppComponent: ComponentType,
  { rootElementId, ...mockOptions }: BootWebAppOptions
): Promise<void> {
  await enableMockWorker(mockOptions);
  mountReactApp(AppComponent, rootElementId);
}
