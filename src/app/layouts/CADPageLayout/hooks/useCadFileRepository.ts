import { useCallback, useEffect, useRef } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { getDrawingDocument } from "../../../services/drawingsApi";
import { graphicDocumentToEntities } from "../../../utils/graphicDocument";
import {
  normalizeDxfFileData,
  normalizePrtsFileData,
  toCadEntitiesFromPrtsPart,
  toRecord,
  type FileData,
} from "../CADPageLayout.file-utils";

interface UseCadFileRepositoryOptions {
  files: FileData[];
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  setEntitiesMap: React.Dispatch<React.SetStateAction<Record<string, Entity[]>>>;
  setCheckedFileIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedFileId: React.Dispatch<React.SetStateAction<string | null>>;
  setShouldFitToView: React.Dispatch<React.SetStateAction<boolean>>;
  setPreferredLayoutAnchorFileId: React.Dispatch<React.SetStateAction<string | null>>;
  shouldPreloadMockPrts: boolean;
  selectedFileId: string | null;
  getTestModeParams: () => string;
}

function clampQuantity(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  const integer = Math.floor(parsed);
  if (integer < 1) return 1;
  if (integer > 9999) return 9999;
  return integer;
}

export const useCadFileRepository = ({
  files,
  setFiles,
  setEntitiesMap,
  setCheckedFileIds,
  setSelectedFileId,
  setShouldFitToView,
  setPreferredLayoutAnchorFileId,
  shouldPreloadMockPrts,
  selectedFileId,
  getTestModeParams,
}: UseCadFileRepositoryOptions) => {
  const filesRef = useRef<FileData[]>(files);
  const fileEditQueueRef = useRef<Map<string, Promise<void>>>(new Map());
  const fileRefreshSeqRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const waitForDxfFileReady = useCallback(
    async (fileId: string, maxAttempts = 30, intervalMs = 500) => {
      const testParams = getTestModeParams();
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const statusResponse = await fetch(`/api/drawing/files/${fileId}/status${testParams}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.status === "ready") return true;
            if (statusData.status === "error") return false;
          }
        } catch (error) {
          console.warn("[CADPageLayout] Failed to poll file status:", error);
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
      return false;
    },
    [getTestModeParams],
  );

  const refreshFileEntities = useCallback(
    async (fileId: string, fileOverride?: FileData) => {
      const file = fileOverride || filesRef.current.find((f) => f.id === fileId);
      if (!file) return;
      const nextSeq = (fileRefreshSeqRef.current.get(fileId) ?? 0) + 1;
      fileRefreshSeqRef.current.set(fileId, nextSeq);
      try {
        let loadedEntities: Entity[] = [];
        if (file.type === "DXF") {
          const drawing = await getDrawingDocument(file.id);
          loadedEntities = graphicDocumentToEntities(drawing.document);
        } else if (file.type === "PRTS") {
          const partIdentifier = file.partId || file.id;
          if (!partIdentifier) return;
          const response = await fetch(`/api/drawing/parts/${partIdentifier}${getTestModeParams()}`);
          if (response.ok) {
            const responseData = await response.json();
            const responseRecord = toRecord(responseData);
            const partPayload =
              responseRecord && responseRecord.part !== undefined ? responseRecord.part : responseData;
            loadedEntities = toCadEntitiesFromPrtsPart(partPayload, partIdentifier);
          }
        } else {
          return;
        }
        if (loadedEntities.length === 0) return;
        const entitiesWithFileId = loadedEntities.map((entity) => ({ ...entity, fileId: file.id }));
        if (fileRefreshSeqRef.current.get(fileId) !== nextSeq) return;
        setEntitiesMap((prev) => ({ ...prev, [file.id]: entitiesWithFileId }));
      } catch (error) {
        console.error("[CADPageLayout] Error refreshing entities:", error);
      }
    },
    [getTestModeParams, setEntitiesMap],
  );

  const enqueueFileEdit = useCallback((fileId: string, task: () => Promise<void>) => {
    const queue = fileEditQueueRef.current;
    const previous = queue.get(fileId) ?? Promise.resolve();
    const next = previous.catch(() => void 0).then(task);
    queue.set(fileId, next);
    void next.finally(() => {
      if (queue.get(fileId) === next) queue.delete(fileId);
    });
    return next;
  }, []);

  const fetchPartQuantityMap = useCallback(async (): Promise<Map<string, number>> => {
    try {
      const response = await fetch(`/api/nesting/parts/quantities${getTestModeParams()}`);
      if (!response.ok) return new Map();
      const payload = await response.json();
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const quantityMap = new Map<string, number>();
      items.forEach((item: { partId?: unknown; quantity?: unknown }) => {
        const partId = typeof item.partId === "string" ? item.partId.trim() : "";
        if (!partId) return;
        quantityMap.set(partId, clampQuantity(item.quantity));
      });
      return quantityMap;
    } catch {
      return new Map();
    }
  }, [getTestModeParams]);

  const mergePrtsQuantities = useCallback(
    (prtsFiles: FileData[], quantityMap: Map<string, number>): FileData[] =>
      prtsFiles.map((file) => {
        const key = file.partId || file.id;
        const resolvedQuantity = key ? quantityMap.get(key) : undefined;
        return {
          ...file,
          quantity: clampQuantity(
            resolvedQuantity !== undefined ? resolvedQuantity : file.quantity,
          ),
        };
      }),
    [],
  );

  const refreshPrtsFileList = useCallback(async () => {
    try {
      const response = await fetch(`/api/drawing/parts${getTestModeParams()}`);
      if (!response.ok) return;
      const payload = await response.json();
      const rawPrtsFiles: FileData[] = (Array.isArray(payload) ? payload : [])
        .map((part) => normalizePrtsFileData(part))
        .filter((part): part is FileData => Boolean(part));
      const quantityMap = await fetchPartQuantityMap();
      const prtsFiles = mergePrtsQuantities(rawPrtsFiles, quantityMap);
      setFiles((prev) => {
        const nonPrts = prev.filter((file) => file.type !== "PRTS");
        const next = [...nonPrts, ...prtsFiles].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        const validIds = new Set(next.map((file) => file.id));
        setCheckedFileIds((checked) => {
          const nextChecked = new Set<string>();
          checked.forEach((id) => {
            if (validIds.has(id)) nextChecked.add(id);
          });
          return nextChecked;
        });
        if (selectedFileId && !validIds.has(selectedFileId)) {
          const fallback = nonPrts.find((file) => file.id === selectedFileId)?.id ?? nonPrts[0]?.id ?? null;
          setSelectedFileId(fallback);
        }
        return next;
      });
    } catch (error) {
      console.error("[CADPageLayout] Failed to refresh PRTS file list:", error);
    }
  }, [
    fetchPartQuantityMap,
    getTestModeParams,
    mergePrtsQuantities,
    selectedFileId,
    setFiles,
    setCheckedFileIds,
    setSelectedFileId,
  ]);

  useEffect(() => {
    const loadFileList = async () => {
      try {
        const testParams = getTestModeParams();
        const filesResponse = await fetch(`/api/drawing/files${testParams}`);
        let dxfFiles: FileData[] = [];
        if (filesResponse.ok) {
          const payload = await filesResponse.json();
          const rows = Array.isArray(payload)
            ? payload
            : (Array.isArray(payload?.files) ? payload.files : []);
          dxfFiles = rows
            .map((file) => normalizeDxfFileData(file))
            .filter((file): file is FileData => Boolean(file));
        }
        const partsResponse = await fetch(`/api/drawing/parts${testParams}`);
        let prtsFiles: FileData[] = [];
        if (partsResponse.ok) {
          const payload = await partsResponse.json();
          prtsFiles = (Array.isArray(payload) ? payload : [])
            .map((part) => normalizePrtsFileData(part))
            .filter((file): file is FileData => Boolean(file));
        }
        const quantityMap = await fetchPartQuantityMap();
        prtsFiles = mergePrtsQuantities(prtsFiles, quantityMap);
        const allFiles = [...dxfFiles, ...prtsFiles].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setFiles(allFiles);
        if (shouldPreloadMockPrts && allFiles.length > 0) {
          const defaultPrtsFiles = allFiles.filter((file) => file.type === "PRTS");
          if (defaultPrtsFiles.length > 0) {
            const defaultIds = defaultPrtsFiles.map((file) => file.id);
            setCheckedFileIds(new Set(defaultIds));
            setSelectedFileId(defaultIds[0]);
            setPreferredLayoutAnchorFileId(defaultIds[0]);
            for (const prtsFile of defaultPrtsFiles) {
              await refreshFileEntities(prtsFile.id, prtsFile);
            }
            setShouldFitToView(true);
          }
        }
        if (allFiles.length === 0) {
          const scratchpad: FileData = { id: "scratchpad", name: "Scratchpad", type: "DXF", fileId: "scratchpad" };
          setFiles([scratchpad]);
          setEntitiesMap({ scratchpad: [] });
          setCheckedFileIds(new Set(["scratchpad"]));
          setSelectedFileId("scratchpad");
          setShouldFitToView(true);
        }
      } catch (error) {
        console.error("[CADPageLayout] Failed to load files:", error);
      }
    };
    void loadFileList();
  }, [
    getTestModeParams,
    fetchPartQuantityMap,
    mergePrtsQuantities,
    refreshFileEntities,
    setFiles,
    setEntitiesMap,
    setCheckedFileIds,
    setSelectedFileId,
    setShouldFitToView,
    setPreferredLayoutAnchorFileId,
    shouldPreloadMockPrts,
  ]);

  return { waitForDxfFileReady, refreshFileEntities, enqueueFileEdit, refreshPrtsFileList };
};
