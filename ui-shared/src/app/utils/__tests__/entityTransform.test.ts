
import { translateEntity, rotateEntity, scaleEntity, mirrorEntity } from '../entityTransform';
import { Entity } from '../../lib/webgpu/EntityToVertices';

describe('entityTransform', () => {
    const mockEntity: Entity = {
        id: 'test-1',
        type: 'LINE',
        layer: '0',
        color: 0,
        geometry: {
            start: { x: 0, y: 0 },
            end: { x: 10, y: 0 }
        }
    };

    test('translateEntity moves line', () => {
        const result = translateEntity(mockEntity, 5, 5);
        const geom = result.geometry as any;
        expect(geom.start).toEqual({ x: 5, y: 5 });
        expect(geom.end).toEqual({ x: 15, y: 5 });
    });

    test('rotateEntity rotates line 90 degrees', () => {
        // Rotate 90 deg (PI/2) around (0,0)
        // (10,0) -> (0, 10)
        const result = rotateEntity(mockEntity, Math.PI / 2, { x: 0, y: 0 });
        const geom = result.geometry as any;
        expect(geom.start.x).toBeCloseTo(0);
        expect(geom.start.y).toBeCloseTo(0);
        expect(geom.end.x).toBeCloseTo(0);
        expect(geom.end.y).toBeCloseTo(10);
    });

    test('scaleEntity scales line', () => {
        const result = scaleEntity(mockEntity, 2, 2, { x: 0, y: 0 });
        const geom = result.geometry as any;
        expect(geom.start).toEqual({ x: 0, y: 0 });
        expect(geom.end).toEqual({ x: 20, y: 0 });
    });

    test('mirrorEntity mirrors line horizontally', () => {
        // Mirror across Y axis (x=0). Axis: (0,0) to (0,10)
        const result = mirrorEntity(mockEntity, { x: 0, y: 0 }, { x: 0, y: 10 });
        const geom = result.geometry as any;
        // (0,0) -> (0,0)
        // (10,0) -> (-10, 0)
        expect(geom.start.x).toBeCloseTo(0);
        expect(geom.end.x).toBeCloseTo(-10);
    });
});
