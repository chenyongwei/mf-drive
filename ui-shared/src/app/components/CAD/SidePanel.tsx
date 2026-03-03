/**
 * Side Panel Component
 *
 * Left panel showing file tree with multi-select checkboxes
 */

import React from 'react';
import { getSidePanelStyles } from './SidePanel.styles';
import {
  PART_SOURCE_DRAG_MIME,
  type PartDragSourcePayload,
} from './types/CADCanvasTypes';
import {
  buildDistinctPartTypeColorMap,
  getRandomPantoneColor,
} from '../../layouts/CADPageLayout/CADPageLayout.styles';
import { buildCollisionContours } from '../../layouts/CADPageLayout/CADPageLayout.collision';
import type { Entity } from '../../lib/webgpu/EntityToVertices';
import {
  resolveProcessStrokeColor,
  type FileExtendedAttribute,
  type ProcessCode,
} from '../../layouts/CADPageLayout/CADPageLayout.file-utils';

type Point2D = { x: number; y: number };
type BoundingBox = { minX: number; minY: number; maxX: number; maxY: number };

interface FileData {
  id: string;
  name: string;
  type: 'DXF' | 'PRTS';
  displayType?: 'DXF' | 'PRTS' | 'PDF';
  sourceKind?: 'upload-dxf' | 'upload-prts' | 'pdf-extract';
  extendedAttributes?: FileExtendedAttribute[];
  extractionMeta?: {
    inputKind?: 'pdf' | 'image';
    confidence?: number;
    warnings?: string[];
  };
  fileId?: string;
  partId?: string;
  quantity?: number;
  contour?: Point2D[];
  bbox?: BoundingBox;
}

interface SidePanelProps {
  files: FileData[];
  selectedFileId: string | null;
  selectedFileIds?: Set<string>;
  checkedFileIds: Set<string>;
  onFileSelect: (
    fileId: string,
    ctx?: { additive: boolean; source: "row" | "rename" },
  ) => void;
  onSelectionClear?: () => void;
  onFileCheck: (fileId: string | string[], isChecked: boolean) => void;
  onFileRename?: (fileId: string, nextName: string) => void;
  onZoomToSelection?: () => void;
  isNestingMode: boolean;
  activeTab: 'DXF' | 'PRTS' | 'PDF';
  onTabChange: (tab: 'DXF' | 'PRTS' | 'PDF') => void;
  onUpload?: () => void;
  onPartQuantityChange?: (partId: string, quantity: number) => Promise<void> | void;
  partEntitiesByFileId?: Record<string, Entity[]>;
  partUnplacedCountByPartId?: Record<string, number>;
  totalUnplacedCount?: number;
  theme?: 'dark' | 'light';
  allowedFileTypes?: ('DXF' | 'PRTS' | 'PDF')[];
}

const MIN_PART_QUANTITY = 1;
const MAX_PART_QUANTITY = 9999;
const THUMBNAIL_SIZE = 44;
const THUMBNAIL_PADDING = 4;
const ATTRIBUTE_PREVIEW_LIMIT = 3;

function clampPartQuantity(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return MIN_PART_QUANTITY;
  const integer = Math.floor(parsed);
  if (integer < MIN_PART_QUANTITY) return MIN_PART_QUANTITY;
  if (integer > MAX_PART_QUANTITY) return MAX_PART_QUANTITY;
  return integer;
}

function isFinitePoint(point: unknown): point is Point2D {
  if (!point || typeof point !== 'object') return false;
  const candidate = point as Partial<Point2D>;
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
}

function contourBoundingBox(contour: Point2D[]): BoundingBox | null {
  if (contour.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  contour.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }
  return { minX, minY, maxX, maxY };
}

function resolvePartBoundingBox(file: FileData, contour: Point2D[]): BoundingBox | null {
  const bbox = file.bbox;
  if (
    bbox &&
    Number.isFinite(bbox.minX) &&
    Number.isFinite(bbox.minY) &&
    Number.isFinite(bbox.maxX) &&
    Number.isFinite(bbox.maxY)
  ) {
    return bbox;
  }
  return contourBoundingBox(contour);
}

function resolvePartTypeKey(sourcePartId: string | undefined, partId: string): string {
  const sourceKey = typeof sourcePartId === 'string' ? sourcePartId.trim() : '';
  if (sourceKey.length > 0) {
    return sourceKey;
  }
  return partId.trim() || partId;
}

function toProcessCode(value: unknown): ProcessCode | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (
    normalized === 'NO_PROCESS'
    || normalized === 'CUT_NORMAL'
    || normalized === 'CUT_SLOW'
    || normalized === 'MARK'
  ) {
    return normalized;
  }
  return null;
}

function resolveDisplayType(file: FileData): 'DXF' | 'PRTS' | 'PDF' {
  return file.displayType ?? file.type;
}

function normalizeExtendedAttributes(file: FileData): FileExtendedAttribute[] {
  if (!Array.isArray(file.extendedAttributes)) return [];
  return file.extendedAttributes
    .map((attribute) => {
      if (!attribute || typeof attribute !== 'object') return null;
      const key = String(attribute.key ?? '').trim();
      const value = String(attribute.value ?? '').trim();
      if (!key || !value) return null;
      const confidence = Number(attribute.confidence);
      return {
        key,
        value,
        ...(Number.isFinite(confidence) ? { confidence } : {}),
        ...(attribute.source ? { source: attribute.source } : {}),
      } satisfies FileExtendedAttribute;
    })
    .filter((attribute): attribute is FileExtendedAttribute => Boolean(attribute));
}

function formatExtendedAttribute(attribute: FileExtendedAttribute): string {
  return `${attribute.key}: ${attribute.value}`;
}

function loopsBoundingBox(loops: Point2D[][]): BoundingBox | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  loops.forEach((loop) => {
    loop.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function mapPointToThumbnail(point: Point2D, bbox: BoundingBox): Point2D {
  const width = Math.max(1, bbox.maxX - bbox.minX);
  const height = Math.max(1, bbox.maxY - bbox.minY);
  const usableSize = THUMBNAIL_SIZE - THUMBNAIL_PADDING * 2;
  const scale = Math.min(usableSize / width, usableSize / height);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const offsetX = (THUMBNAIL_SIZE - scaledWidth) / 2;
  const offsetY = (THUMBNAIL_SIZE - scaledHeight) / 2;

  return {
    x: offsetX + (point.x - bbox.minX) * scale,
    y: THUMBNAIL_SIZE - (offsetY + (point.y - bbox.minY) * scale),
  };
}

function buildThumbnailPath(loops: Point2D[][], bbox: BoundingBox): string {
  return loops
    .filter((loop) => loop.length >= 3)
    .map((loop) => {
      const mapped = loop.map((point) => mapPointToThumbnail(point, bbox));
      const [first, ...rest] = mapped;
      if (!first) return '';
      const segments = rest.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
      return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${segments} Z`;
    })
    .filter(Boolean)
    .join(' ');
}

const SidePanel: React.FC<SidePanelProps> = ({
  files,
  selectedFileId,
  selectedFileIds,
  checkedFileIds,
  onFileSelect,
  onSelectionClear,
  onFileCheck,
  onFileRename,
  onZoomToSelection,
  isNestingMode,
  activeTab,
  onTabChange,
  onUpload,
  onPartQuantityChange,
  partEntitiesByFileId,
  partUnplacedCountByPartId,
  totalUnplacedCount = 0,
  theme = 'dark',
  allowedFileTypes = ['DXF', 'PRTS'],
}) => {
  void activeTab;
  void onTabChange;
  const styles = React.useMemo(() => getSidePanelStyles(theme), [theme]);
  const [lastCheckedId, setLastCheckedId] = React.useState<string | null>(null);
  const [editingFileId, setEditingFileId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [quantityDrafts, setQuantityDrafts] = React.useState<Record<string, string>>({});
  const [updatingPartIds, setUpdatingPartIds] = React.useState<Set<string>>(new Set());
  const enableListMultiSelect = isNestingMode;
  const showUnplacedCounts = isNestingMode;
  const selectedFileSet = React.useMemo(() => {
    if (selectedFileIds) return selectedFileIds;
    return selectedFileId ? new Set([selectedFileId]) : new Set<string>();
  }, [selectedFileId, selectedFileIds]);

  const getPartId = React.useCallback((file: FileData) => String(file.partId || file.id), []);
  const getPartSourceId = React.useCallback((file: FileData) => {
    const sourcePartId = String(file.partId || file.id || '').trim();
    return sourcePartId.length > 0 ? sourcePartId : null;
  }, []);
  const getCommittedQuantity = React.useCallback((file: FileData) => clampPartQuantity(file.quantity), []);
  const partFillColorByPartId = React.useMemo(() => {
    if (!isNestingMode) return {} as Record<string, string>;
    const prtsFiles = files.filter((file) => file.type === 'PRTS');
    const typeKeys = prtsFiles.map((file) =>
      resolvePartTypeKey(String(file.partId || file.id), file.id),
    );
    const typeColorMap = buildDistinctPartTypeColorMap(typeKeys);
    const colorMap: Record<string, string> = {};
    prtsFiles.forEach((file) => {
      const sourcePartId = String(file.partId || file.id);
      const typeKey = resolvePartTypeKey(sourcePartId, file.id);
      const partColor = typeColorMap.get(typeKey) ?? getRandomPantoneColor(typeKey);
      colorMap[sourcePartId] = partColor;
      colorMap[String(file.id)] = partColor;
    });
    return colorMap;
  }, [files, isNestingMode]);
  const getDisplayQuantity = React.useCallback(
    (file: FileData) => {
      const partId = getPartId(file);
      return quantityDrafts[partId] ?? String(getCommittedQuantity(file));
    },
    [getCommittedQuantity, getPartId, quantityDrafts],
  );
  const isPartUpdating = React.useCallback((partId: string) => updatingPartIds.has(partId), [updatingPartIds]);

  const clearQuantityDraft = React.useCallback((partId: string) => {
    setQuantityDrafts((prev) => {
      if (!(partId in prev)) return prev;
      const next = { ...prev };
      delete next[partId];
      return next;
    });
  }, []);

  const runQuantityUpdate = React.useCallback(
    async (partId: string, quantity: number) => {
      if (!onPartQuantityChange) return;
      setUpdatingPartIds((prev) => {
        const next = new Set(prev);
        next.add(partId);
        return next;
      });
      try {
        await onPartQuantityChange(partId, quantity);
      } finally {
        setUpdatingPartIds((prev) => {
          const next = new Set(prev);
          next.delete(partId);
          return next;
        });
      }
    },
    [onPartQuantityChange],
  );

  const buildPartDragPayload = React.useCallback(
    (file: FileData): PartDragSourcePayload | null => {
      const sourcePartId = getPartSourceId(file);
      if (!sourcePartId) return null;
      const fileId = String(file.id || '').trim();
      if (!fileId) return null;
      const name = String(file.name ?? sourcePartId).trim() || sourcePartId;
      return { sourcePartId, fileId, name };
    },
    [getPartSourceId],
  );

  const isInteractiveDragSource = React.useCallback((target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('input,button,textarea,select,[data-no-row-drag="true"]'));
  }, []);

  const handleRowDragStart = React.useCallback(
    (
      event: React.DragEvent<HTMLDivElement>,
      file: FileData,
      isChecked: boolean,
      isPartRow: boolean,
    ) => {
      if (!isPartRow || !isChecked || isInteractiveDragSource(event.target)) {
        event.preventDefault();
        return;
      }

      const payload = buildPartDragPayload(file);
      if (!payload || !event.dataTransfer) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData(PART_SOURCE_DRAG_MIME, JSON.stringify(payload));
      event.dataTransfer.setData('text/plain', payload.name);
    },
    [buildPartDragPayload, isInteractiveDragSource],
  );

  const visibleFiles = files.filter((file) => allowedFileTypes.includes(resolveDisplayType(file)));

  const checkedInVisible = visibleFiles.filter((file) => checkedFileIds.has(file.id)).length;

  // Handle select all / deselect all
  const handleSelectAll = () => {
    const allChecked = visibleFiles.every((file) => checkedFileIds.has(file.id));
    const ids = visibleFiles.map((file) => file.id);
    onFileCheck(ids, !allChecked);
    // Trigger zoom after selection change
    setTimeout(() => onZoomToSelection?.(), 100);
  };

  // Handle item check with modifier keys: Shift for range, Ctrl for toggle
  const handleItemCheck = (id: string, isChecked: boolean, shiftKey: boolean) => {
    if (shiftKey && lastCheckedId) {
      // Shift+click: select range
      const currentIndex = visibleFiles.findIndex((file) => file.id === id);
      const lastIndex = visibleFiles.findIndex((file) => file.id === lastCheckedId);

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = visibleFiles.slice(start, end + 1).map((file) => file.id);

        onFileCheck(rangeIds, isChecked);
        setLastCheckedId(id);
        // Trigger zoom after selection change
        setTimeout(() => onZoomToSelection?.(), 100);
        return;
      }
    }

    // For Ctrl+click or normal click: just toggle this item
    onFileCheck(id, isChecked);
    setLastCheckedId(id);
    // Trigger zoom after selection change
    setTimeout(() => onZoomToSelection?.(), 100);
  };

  // Handle row click - selection only. Checkbox state is controlled by the checkbox itself.
  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>, fileId: string) => {
    const additive = enableListMultiSelect && (event.ctrlKey || event.metaKey);
    onFileSelect(fileId, { additive, source: "row" });

    // If user selects an unchecked file row, auto-check it so drawing target stays visible.
    if (!checkedFileIds.has(fileId)) {
      onFileCheck(fileId, true);
      setLastCheckedId(fileId);
      setTimeout(() => onZoomToSelection?.(), 100);
    }
  };

  const startRename = (file: FileData) => {
    setEditingFileId(file.id);
    setEditingName(file.name);
    onFileSelect(file.id, { additive: false, source: "rename" });
  };

  const commitRename = (file: FileData) => {
    const normalized = editingName.trim();
    const nextName = normalized.length > 0 ? normalized : file.name;
    if (nextName !== file.name) {
      onFileRename?.(file.id, nextName);
    }
    setEditingFileId(null);
    setEditingName('');
  };

  const commitPartQuantity = React.useCallback(
    async (file: FileData, rawValue?: string) => {
      const partId = getPartId(file);
      if (isPartUpdating(partId)) {
        clearQuantityDraft(partId);
        return;
      }

      const currentQuantity = getCommittedQuantity(file);
      const nextRaw = (rawValue ?? quantityDrafts[partId] ?? '').trim();
      const parsed = nextRaw.length > 0 ? Number.parseInt(nextRaw, 10) : Number.NaN;
      const nextQuantity = Number.isFinite(parsed) ? clampPartQuantity(parsed) : currentQuantity;

      clearQuantityDraft(partId);
      if (nextQuantity === currentQuantity) return;
      await runQuantityUpdate(partId, nextQuantity);
    },
    [
      clearQuantityDraft,
      getCommittedQuantity,
      getPartId,
      isPartUpdating,
      quantityDrafts,
      runQuantityUpdate,
    ],
  );

  const stepPartQuantity = React.useCallback(
    async (file: FileData, delta: number) => {
      const partId = getPartId(file);
      if (isPartUpdating(partId)) return;

      const currentQuantity = getCommittedQuantity(file);
      const draft = quantityDrafts[partId];
      const draftParsed =
        typeof draft === 'string' && /^\d+$/.test(draft) ? Number.parseInt(draft, 10) : currentQuantity;
      const nextQuantity = clampPartQuantity(draftParsed + delta);
      clearQuantityDraft(partId);
      if (nextQuantity === currentQuantity) return;
      await runQuantityUpdate(partId, nextQuantity);
    },
    [
      clearQuantityDraft,
      getCommittedQuantity,
      getPartId,
      isPartUpdating,
      quantityDrafts,
      runQuantityUpdate,
    ],
  );

  const renderPartThumbnail = React.useCallback(
    (file: FileData) => {
      const entityCandidates = [
        String(file.id || '').trim(),
        String(file.fileId || '').trim(),
      ].filter((id) => id.length > 0);
      const partEntities = entityCandidates
        .map((candidate) => partEntitiesByFileId?.[candidate] ?? [])
        .find((entities) => entities.length > 0) ?? [];

      const contour = Array.isArray(file.contour)
        ? file.contour.filter((point): point is Point2D => isFinitePoint(point))
        : [];
      const fallbackBbox = resolvePartBoundingBox(file, contour);

      let loops: Point2D[][] = [];
      if (partEntities.length > 0 && fallbackBbox) {
        const contourData = buildCollisionContours(
          partEntities,
          fallbackBbox,
          contour.length >= 3 ? contour : undefined,
        );
        const outer = contourData.outer.filter((point): point is Point2D => isFinitePoint(point));
        const inners = contourData.inners.map((inner) =>
          inner.filter((point): point is Point2D => isFinitePoint(point)),
        );
        if (outer.length >= 3) {
          loops = [outer, ...inners.filter((inner) => inner.length >= 3)];
        }
      }

      if (loops.length === 0 && contour.length >= 3) {
        loops = [contour];
      }

      const bbox = loopsBoundingBox(loops) ?? fallbackBbox;
      if (loops.length === 0 || !bbox) {
        return <span style={styles.thumbnailFallback}>图</span>;
      }

      const pathData = buildThumbnailPath(loops, bbox);
      if (!pathData) {
        return <span style={styles.thumbnailFallback}>图</span>;
      }
      const sourcePartId = getPartSourceId(file);
      const primaryEntity = partEntities.find((entity) => !entity.isInnerContour) ?? partEntities[0];
      const processCode =
        toProcessCode(primaryEntity?.processCode)
        || toProcessCode((file as { processCode?: unknown }).processCode)
        || null;
      const stroke = processCode
        ? resolveProcessStrokeColor(processCode)
        : (theme === 'dark' ? '#8cd0ff' : '#1f6ea8');
      const fill = partFillColorByPartId[String(sourcePartId || file.id)]
        || (theme === 'dark' ? '#1a1a1c' : '#ffffff');
      return (
        <svg width={THUMBNAIL_SIZE} height={THUMBNAIL_SIZE} viewBox={`0 0 ${THUMBNAIL_SIZE} ${THUMBNAIL_SIZE}`}>
          <path
            d={pathData}
            fill={fill}
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      );
    },
    [getPartSourceId, partEntitiesByFileId, partFillColorByPartId, styles.thumbnailFallback, theme],
  );

  return (
    <div style={styles.container} data-testid="side-panel">
      <div style={styles.header}>
        <div style={styles.title}>
          {isNestingMode ? '📦 零件列表' : '📁 文件列表'}
        </div>
        <button
          style={styles.uploadBtn}
          onClick={onUpload}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a8eef'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a9eff'}
        >
          📄 上传
        </button>
      </div>

      {/* File Count & Select All */}
      <div style={styles.fileCount}>
        <span>
          已选 {checkedInVisible} / {visibleFiles.length} 个文件
          {showUnplacedCounts ? ` · 未排 ${totalUnplacedCount}` : ""}
        </span>
        <button
          style={styles.selectAllBtn}
          onClick={handleSelectAll}
        >
          {visibleFiles.every((file) => checkedFileIds.has(file.id)) ? '取消全选' : '全选'}
        </button>
      </div>

      {/* File List */}
      {visibleFiles.length === 0 ? (
        <div
          style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '20px' }}
          onClick={() => {
            if (enableListMultiSelect) onSelectionClear?.();
          }}
        >
          暂无文件<br />点击上方"上传文件"按钮添加
        </div>
      ) : (
        <div
          style={{ flex: 1, overflow: 'auto' }}
          data-testid="file-list-container"
          onClick={(event) => {
            if (!enableListMultiSelect) return;
            if (event.target === event.currentTarget) {
              onSelectionClear?.();
            }
          }}
        >
          {visibleFiles.map((file) => {
            const isChecked = checkedFileIds.has(file.id);
            const isSelected = enableListMultiSelect
              ? selectedFileSet.has(file.id)
              : selectedFileId === file.id;
            const isPartRow = isNestingMode && file.type === 'PRTS';
            const rowAttributes = isPartRow ? [] : normalizeExtendedAttributes(file);
            const rowAttributePreview = rowAttributes
              .slice(0, ATTRIBUTE_PREVIEW_LIMIT)
              .map((attribute) => formatExtendedAttribute(attribute));
            const rowAttributeDetails = rowAttributes
              .map((attribute) => formatExtendedAttribute(attribute))
              .join('\n');
            const partId = getPartId(file);
            const isQuantityUpdating = isPartUpdating(partId);
            const displayedQuantity = getDisplayQuantity(file);
            const fileName = String(file.name ?? '').trim() || partId;
            const rowUnplaced = isPartRow && showUnplacedCounts
              ? Math.max(0, Number(partUnplacedCountByPartId?.[partId] ?? 0))
              : 0;
            const rowTitle = isPartRow
              ? `${fileName}\nPart ID: ${partId}\n数量: ${displayedQuantity}\n未排: ${rowUnplaced}`
              : `${fileName}${rowAttributeDetails ? `\n${rowAttributeDetails}` : ''}`;

            return (
              <div
                key={file.id}
                style={{
                  ...styles.fileItem,
                  ...(isPartRow ? styles.fileItemTwoLine : {}),
                  ...(isSelected ? styles.fileItemSelected : {}),
                  ...(isChecked && !isSelected ? styles.fileItemChecked : {}),
                }}
                onClick={(event) => handleRowClick(event, file.id)}
                draggable={isPartRow && isChecked}
                onDragStart={(event) => handleRowDragStart(event, file, isChecked, isPartRow)}
                data-testid={`file-item-${file.id}`}
                title={rowTitle}
              >
                <input
                  type="checkbox"
                  data-testid={`file-checkbox-${file.id}`}
                  style={styles.checkbox}
                  checked={isChecked}
                  draggable={false}
                  onChange={() => {
                    // Handled by onClick below
                  }}
                  onDragStart={(event) => event.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle with modifier key support
                    handleItemCheck(file.id, !isChecked, e.shiftKey);
                  }}
                />
                {isPartRow ? (
                  <div style={styles.partRowBody}>
                    <div style={styles.partRowTop}>
                      {editingFileId === file.id ? (
                        <input
                          style={{ ...styles.fileNameInput, ...styles.fileNameInputTwoLine }}
                          value={editingName}
                          autoFocus
                          draggable={false}
                          onChange={(e) => setEditingName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onDragStart={(event) => event.stopPropagation()}
                          onBlur={() => commitRename(file)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitRename(file);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setEditingFileId(null);
                              setEditingName('');
                            }
                          }}
                        />
                      ) : (
                        <span
                          style={styles.fileNameTwoLine}
                          title={rowTitle}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startRename(file);
                          }}
                        >
                          {fileName}
                        </span>
                      )}
                    </div>
                    {editingFileId !== file.id && (
                      <div
                        style={styles.partRowBottom}
                        data-no-row-drag="true"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={styles.unplacedBadge} title="未排零件数量">
                          未排 {rowUnplaced}
                        </span>
                        <div style={styles.quantityControls} title="排样实例数量">
                          <button
                            type="button"
                            style={{
                              ...styles.quantityButton,
                              opacity: isQuantityUpdating ? 0.6 : 1,
                              cursor: isQuantityUpdating ? 'not-allowed' : styles.quantityButton.cursor,
                            }}
                            disabled={isQuantityUpdating}
                            draggable={false}
                            onDragStart={(event) => event.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              void stepPartQuantity(file, -1);
                            }}
                          >
                            -
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            style={styles.quantityInput}
                            value={displayedQuantity}
                            disabled={isQuantityUpdating}
                            draggable={false}
                            onClick={(e) => e.stopPropagation()}
                            onDragStart={(event) => event.stopPropagation()}
                            onFocus={(e) => {
                              e.stopPropagation();
                              const current = String(getCommittedQuantity(file));
                              setQuantityDrafts((prev) => ({ ...prev, [partId]: current }));
                              e.currentTarget.select();
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*$/.test(value)) {
                                setQuantityDrafts((prev) => ({ ...prev, [partId]: value }));
                              }
                            }}
                            onBlur={(e) => {
                              void commitPartQuantity(file, e.currentTarget.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                clearQuantityDraft(partId);
                                e.currentTarget.blur();
                              }
                            }}
                          />
                          <button
                            type="button"
                            style={{
                              ...styles.quantityButton,
                              opacity: isQuantityUpdating ? 0.6 : 1,
                              cursor: isQuantityUpdating ? 'not-allowed' : styles.quantityButton.cursor,
                            }}
                            disabled={isQuantityUpdating}
                            draggable={false}
                            onDragStart={(event) => event.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              void stepPartQuantity(file, 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={styles.thumbnailContainer} title="零件缩略图">
                      {renderPartThumbnail(file)}
                    </div>
                  </div>
                ) : (
                  <div style={styles.nonPartRowBody}>
                    {editingFileId === file.id ? (
                      <input
                        style={styles.fileNameInput}
                        value={editingName}
                        autoFocus
                        draggable={false}
                        onChange={(e) => setEditingName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onDragStart={(event) => event.stopPropagation()}
                        onBlur={() => commitRename(file)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitRename(file);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingFileId(null);
                            setEditingName('');
                          }
                        }}
                      />
                    ) : (
                      <span
                        style={styles.fileName}
                        title={rowTitle}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startRename(file);
                        }}
                      >
                        {fileName}
                      </span>
                    )}
                    {editingFileId !== file.id && rowAttributePreview.length > 0 && (
                      <span style={styles.fileMetaPreview} title={rowAttributeDetails}>
                        {rowAttributePreview.join(' · ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Hint */}
      <div style={{ fontSize: '11px', color: '#666', marginTop: '12px', textAlign: 'center' }}>
        勾选文件以在视图中显示
      </div>
    </div>
  );
};

export default SidePanel;
