import { Vertex } from './WebGPUEngine';

export interface Point {
  x: number;
  y: number;
}

export interface Contour {
  points: Point[];
  closed: boolean;
  centerPoint?: Point;
}

export enum ChannelType {
  CHANNEL_1 = 'CHANNEL_1',
  CHANNEL_2 = 'CHANNEL_2',
  CHANNEL_3 = 'CHANNEL_3',
  CHANNEL_4 = 'CHANNEL_4',
}

export interface PartFillData {
  outer: Vertex[];
  holes: Vertex[];
}
