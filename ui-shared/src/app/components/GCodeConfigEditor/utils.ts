import { GCodeDeviceType } from '@dxf-fix/shared';

/**
 * Get display name for device type
 */
export function getDeviceTypeName(type: GCodeDeviceType): string {
  const names: Record<GCodeDeviceType, string> = {
    LASER: '激光',
    FLAME: '火焰',
    PLASMA: '等离子',
  };
  return names[type] || type;
}
