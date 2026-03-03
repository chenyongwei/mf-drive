import { ChannelType } from './PartFillGenerator.types';

const CHANNEL_COLORS: Record<ChannelType, { r: number; g: number; b: number; a: number }> = {
  [ChannelType.CHANNEL_1]: { r: 1.0, g: 1.0, b: 1.0, a: 0.6 },
  [ChannelType.CHANNEL_2]: { r: 1.0, g: 0.0, b: 0.0, a: 0.6 },
  [ChannelType.CHANNEL_3]: { r: 0.0, g: 1.0, b: 1.0, a: 0.6 },
  [ChannelType.CHANNEL_4]: { r: 1.0, g: 1.0, b: 0.0, a: 0.6 },
};

export function getChannelColor(channel: ChannelType): { r: number; g: number; b: number; a: number } {
  return CHANNEL_COLORS[channel];
}
