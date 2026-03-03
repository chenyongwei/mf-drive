import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { createDefaultPlates, useCadPageState } from "../useCadPageState";

beforeEach(() => {
  const storage = new Map<string, string>();
  const localStorageMock = {
    getItem: vi.fn((key: string) => (storage.has(key) ? storage.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(String(key), String(value));
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(String(key));
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: localStorageMock,
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createDefaultPlates", () => {
  it("returns one legacy default plate when not in mock mode", () => {
    const plates = createDefaultPlates(false);

    expect(plates).toHaveLength(1);
    expect(plates[0]).toMatchObject({
      id: "plate-1",
      name: "Plate 1",
      width: 2000,
      height: 1000,
      margin: 10,
      position: { x: 0, y: 0 },
    });
  });

  it("returns five preset plates in mock mode", () => {
    const plates = createDefaultPlates(true);

    expect(plates).toHaveLength(5);
    expect(plates.map((plate) => [plate.width, plate.height])).toEqual([
      [4000, 2000],
      [6000, 2000],
      [8000, 2000],
      [4000, 3000],
      [4000, 1500],
    ]);
    expect(plates.map((plate) => plate.id)).toEqual([
      "plate-1",
      "plate-2",
      "plate-3",
      "plate-4",
      "plate-5",
    ]);
  });
});

describe("useCadPageState", () => {
  it("initializes nesting state with default plates without runtime errors", () => {
    const { result } = renderHook(() =>
      useCadPageState({ initialMode: "nesting", isNestingModeByFlag: false }),
    );

    expect(result.current.activeTab).toBe("PRTS");
    expect(result.current.plates).toEqual(createDefaultPlates(false));
  });
});
