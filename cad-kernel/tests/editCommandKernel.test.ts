import assert from 'node:assert/strict';
import {
  computeExtendPlan,
  computeTrimPlan,
  executeEditCommandKernel,
  type CadKernelEntity,
} from '../src';

const baseEntities: CadKernelEntity[] = [
  {
    id: 'line-target',
    fileId: 'file-1',
    type: 'LINE',
    layerId: 'CUT',
    geometry: {
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    },
  },
  {
    id: 'line-boundary',
    fileId: 'file-1',
    type: 'LINE',
    layerId: 'CUT',
    geometry: {
      start: { x: 60, y: -50 },
      end: { x: 60, y: 50 },
    },
  },
  {
    id: 'arc-target',
    fileId: 'file-1',
    type: 'ARC',
    layerId: 'CUT',
    geometry: {
      center: { x: 200, y: 100 },
      radius: 50,
      startAngle: 0,
      endAngle: 1,
    },
  },
  {
    id: 'text-1',
    fileId: 'file-1',
    type: 'TEXT',
    layerId: 'CUT',
    geometry: {
      position: { x: 20, y: 20 },
      text: 'A',
      height: 24,
      rotation: 0,
    },
    attributes: {
      textData: {
        content: 'A',
        fontSize: 24,
      },
    },
  },
];

const trimPlan = computeTrimPlan({
  entities: baseEntities,
  targetEntityId: 'line-target',
  clickPoint: { x: 80, y: 0 },
});
assert.equal(trimPlan.success, true);

const extendPlan = computeExtendPlan({
  entities: [
    ...baseEntities,
    {
      id: 'line-extend-target',
      fileId: 'file-1',
      type: 'LINE',
      geometry: {
        start: { x: 0, y: 20 },
        end: { x: 40, y: 20 },
      },
    },
    {
      id: 'line-extend-boundary',
      fileId: 'file-1',
      type: 'LINE',
      geometry: {
        start: { x: 90, y: -20 },
        end: { x: 90, y: 40 },
      },
    },
  ],
  targetEntityId: 'line-extend-target',
  clickPoint: { x: 40, y: 20 },
});
assert.equal(extendPlan.success, true);

const createResult = await executeEditCommandKernel(
  {
    fileId: 'file-1',
    command: 'create',
    params: {
      entityData: {
        id: 'line-created',
        type: 'LINE',
        geometry: {
          start: { x: 10, y: 10 },
          end: { x: 30, y: 10 },
        },
      },
    },
  },
  { entities: baseEntities },
);
assert.equal(createResult.success, true);
assert.ok(createResult.nextEntities.some((entity) => entity.id === 'line-created'));

const moveResult = await executeEditCommandKernel(
  {
    fileId: 'file-1',
    command: 'move',
    params: {
      entityId: 'line-target',
      delta: { x: 5, y: 7 },
    },
  },
  { entities: baseEntities },
);
assert.equal(moveResult.success, true);
assert.equal(Number((moveResult.updatedEntities[0].geometry as any).start.x), 5);

const updateTextResult = await executeEditCommandKernel(
  {
    fileId: 'file-1',
    command: 'update-text',
    params: {
      entityId: 'text-1',
      textData: {
        content: 'AB',
        fontSize: 26,
      },
    },
  },
  { entities: baseEntities },
);
assert.equal(updateTextResult.success, true);
assert.equal((updateTextResult.updatedEntities[0].geometry as any).text, 'AB');

const trimResult = await executeEditCommandKernel(
  {
    fileId: 'file-1',
    command: 'trim',
    params: {
      entityId: 'line-target',
      clickPoint: { x: 95, y: 0 },
    },
  },
  { entities: baseEntities },
);
assert.equal(trimResult.success, true);
assert.equal(trimResult.boundarySource, 'auto');

const invalidMoveResult = await executeEditCommandKernel(
  {
    fileId: 'file-1',
    command: 'move',
    params: {
      entityId: 'line-target',
    },
  },
  { entities: baseEntities },
);
assert.equal(invalidMoveResult.success, false);
assert.equal(invalidMoveResult.errorCode, 'INVALID_PARAMS');

console.log('cad-kernel tests passed');
