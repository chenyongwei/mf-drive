import { GCodeConfig, GCodeDeviceType } from '@dxf-fix/shared';

export const getDeviceTypeName = (deviceType: GCodeDeviceType): string => {
  const names: Record<GCodeDeviceType, string> = {
    LASER: '激光切割',
    FLAME: '火焰切割',
    PLASMA: '等离子切割',
  };
  return names[deviceType] || deviceType;
};

export const getIconByDeviceType = (deviceType: GCodeDeviceType): string => {
  const icons: Record<GCodeDeviceType, string> = {
    LASER: '🔥',
    FLAME: '🔥',
    PLASMA: '⚡',
  };
  return icons[deviceType] || '⚙️';
};

export const groupPresetsByDeviceType = (presets: GCodeConfig[]) =>
  Object.entries(
    presets.reduce((acc, preset) => {
      const deviceType = preset.deviceType;
      if (!acc[deviceType]) {
        acc[deviceType] = [];
      }
      acc[deviceType].push(preset);
      return acc;
    }, {} as Record<string, GCodeConfig[]>),
  );
