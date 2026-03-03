import type { Entity } from '../../../lib/webgpu/EntityToVertices';
import { DEFAULT_PAYLOAD, type TextUpdatePayload } from './TextPropertiesPanel.types';

export function toFiniteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function radiansToDegrees(radians: number): number {
  if (!Number.isFinite(radians)) {
    return 0;
  }
  return (radians * 180) / Math.PI;
}

export function degreesToRadians(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }
  return (degrees * Math.PI) / 180;
}

export function derivePayload(entity: Entity | null): TextUpdatePayload {
  if (!entity) {
    return DEFAULT_PAYLOAD;
  }

  const attributes =
    entity.attributes && typeof entity.attributes === 'object'
      ? (entity.attributes as Record<string, unknown>)
      : null;
  const textData =
    attributes?.textData && typeof attributes.textData === 'object'
      ? (attributes.textData as Record<string, unknown>)
      : null;
  const geometry = entity.geometry as
    | { text?: unknown; height?: unknown; rotation?: unknown }
    | undefined;

  const content = String(textData?.content ?? geometry?.text ?? '');
  const alignHRaw = String(textData?.alignH ?? DEFAULT_PAYLOAD.alignH).toLowerCase();
  const alignVRaw = String(textData?.alignV ?? DEFAULT_PAYLOAD.alignV).toLowerCase();
  const lineModeRaw = String(textData?.lineMode ?? DEFAULT_PAYLOAD.lineMode).toLowerCase();

  return {
    content,
    fontId: String(textData?.fontId ?? DEFAULT_PAYLOAD.fontId),
    fontFamily: String(textData?.fontFamily ?? DEFAULT_PAYLOAD.fontFamily),
    fontSize: toFiniteNumber(textData?.fontSize ?? geometry?.height, 24),
    lineHeight: toFiniteNumber(textData?.lineHeight, DEFAULT_PAYLOAD.lineHeight),
    rotation: toFiniteNumber(textData?.rotation ?? geometry?.rotation, DEFAULT_PAYLOAD.rotation),
    alignH:
      alignHRaw === 'center' || alignHRaw === 'right'
        ? (alignHRaw as TextUpdatePayload['alignH'])
        : 'left',
    alignV:
      alignVRaw === 'top' ||
      alignVRaw === 'middle' ||
      alignVRaw === 'bottom' ||
      alignVRaw === 'baseline'
        ? (alignVRaw as TextUpdatePayload['alignV'])
        : 'baseline',
    lineMode: lineModeRaw === 'single' ? 'single' : 'double',
    tolerance: toFiniteNumber(textData?.tolerance, DEFAULT_PAYLOAD.tolerance),
  };
}
