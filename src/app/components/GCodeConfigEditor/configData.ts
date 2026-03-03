import { getGCodeConfigs, getGCodePresets } from '../../services/api';
import type { GCodeConfig } from '@dxf-fix/shared';

export async function loadGCodeConfigLists(): Promise<{
  presets: GCodeConfig[];
  userConfigs: GCodeConfig[];
}> {
  const [presets, userConfigs] = await Promise.all([
    getGCodePresets(),
    getGCodeConfigs(),
  ]);

  return { presets, userConfigs };
}

export async function loadGCodeConfigListsIntoState(
  setPresets: (configs: GCodeConfig[]) => void,
  setUserConfigs: (configs: GCodeConfig[]) => void,
): Promise<void> {
  try {
    const { presets, userConfigs } = await loadGCodeConfigLists();
    setPresets(presets);
    setUserConfigs(userConfigs);
  } catch (error) {
    console.error('Failed to load configs:', error);
  }
}
