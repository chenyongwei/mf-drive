export function getEntityBBox(entity: any) {
  const geo = entity.geometry;
  const type = (entity.type || '').toUpperCase();
  switch (type) {
    case 'LINE':
      return {
        minX: Math.min(geo.start.x, geo.end.x),
        minY: Math.min(geo.start.y, geo.end.y),
        maxX: Math.max(geo.start.x, geo.end.x),
        maxY: Math.max(geo.start.y, geo.end.y),
      };
    case 'ARC':
    case 'CIRCLE': {
      const r = geo.radius;
      return {
        minX: geo.center.x - r,
        minY: geo.center.y - r,
        maxX: geo.center.x + r,
        maxY: geo.center.y + r,
      };
    }
    case 'POLYLINE':
    case 'LWPOLYLINE':
      if (geo.points && geo.points.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let hasValidPoint = false;
        for (const p of geo.points) {
          if (
            !p ||
            typeof p.x !== 'number' ||
            typeof p.y !== 'number' ||
            Number.isNaN(p.x) ||
            Number.isNaN(p.y)
          ) {
            continue;
          }
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
          hasValidPoint = true;
        }
        if (hasValidPoint) return { minX, minY, maxX, maxY };
      }
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    case 'TEXT':
    case 'MTEXT': {
      const anchor =
        geo.position &&
        typeof geo.position.x === 'number' &&
        typeof geo.position.y === 'number'
          ? { x: geo.position.x, y: geo.position.y }
          : null;
      if (!anchor) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      }

      const attrs =
        entity.attributes && typeof entity.attributes === 'object'
          ? (entity.attributes as Record<string, any>)
          : null;
      const textRender =
        attrs && attrs.textRender && typeof attrs.textRender === 'object'
          ? (attrs.textRender as Record<string, any>)
          : null;
      const localBBox =
        textRender &&
        textRender.localBBox &&
        typeof textRender.localBBox === 'object'
          ? (textRender.localBBox as Record<string, any>)
          : null;

      if (
        localBBox &&
        Number.isFinite(localBBox.minX) &&
        Number.isFinite(localBBox.minY) &&
        Number.isFinite(localBBox.maxX) &&
        Number.isFinite(localBBox.maxY)
      ) {
        const rotation = Number(attrs?.textData?.rotation ?? geo.rotation ?? 0);
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const corners = [
          { x: localBBox.minX, y: localBBox.minY },
          { x: localBBox.maxX, y: localBBox.minY },
          { x: localBBox.maxX, y: localBBox.maxY },
          { x: localBBox.minX, y: localBBox.maxY },
        ];
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        corners.forEach((corner) => {
          const rx = corner.x * cos - corner.y * sin + anchor.x;
          const ry = corner.x * sin + corner.y * cos + anchor.y;
          minX = Math.min(minX, rx);
          minY = Math.min(minY, ry);
          maxX = Math.max(maxX, rx);
          maxY = Math.max(maxY, ry);
        });
        if (
          Number.isFinite(minX) &&
          Number.isFinite(minY) &&
          Number.isFinite(maxX) &&
          Number.isFinite(maxY)
        ) {
          return { minX, minY, maxX, maxY };
        }
      }

      const textWidth = String(geo.text || '').length * (geo.height || 1) * 0.6;
      const tx = anchor.x;
      const ty = anchor.y;
      const th = geo.height || 1;
      return {
        minX: tx,
        minY: ty - th,
        maxX: tx + textWidth,
        maxY: ty,
      };
    }
    case 'SPLINE': {
      const splinePoints =
        geo.controlPoints && geo.controlPoints.length > 0
          ? geo.controlPoints
          : geo.points;
      if (splinePoints && splinePoints.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let hasValidPoint = false;
        for (const p of splinePoints) {
          if (
            !p ||
            typeof p.x !== 'number' ||
            typeof p.y !== 'number' ||
            Number.isNaN(p.x) ||
            Number.isNaN(p.y)
          ) {
            continue;
          }
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
          hasValidPoint = true;
        }
        if (hasValidPoint) return { minX, minY, maxX, maxY };
      }
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    case 'ELLIPSE': {
      const center = geo.center;
      const major = geo.majorAxisEndPoint || geo.majorAxis;

      if (center && major) {
        const ratio =
          geo.ratio || geo.minorAxisRatio || (geo.minorAxis ? 1.0 : 1.0);
        let minorX;
        let minorY;
        if (geo.minorAxis) {
          minorX = geo.minorAxis.x;
          minorY = geo.minorAxis.y;
        } else {
          minorX = -major.y * ratio;
          minorY = major.x * ratio;
        }

        const majorX = major.x;
        const majorY = major.y;

        const startParam = geo.startAngle || 0;
        const endParam = geo.endAngle !== undefined ? geo.endAngle : 2 * Math.PI;
        let delta = endParam - startParam;
        if (delta <= 0) delta += 2 * Math.PI;
        const isFullEllipse = Math.abs(delta - 2 * Math.PI) < 0.001;

        if (isFullEllipse) {
          const halfW = Math.sqrt(majorX * majorX + minorX * minorX);
          const halfH = Math.sqrt(majorY * majorY + minorY * minorY);
          return {
            minX: center.x - halfW,
            minY: center.y - halfH,
            maxX: center.x + halfW,
            maxY: center.y + halfH,
          };
        }

        const numSamples = 32;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let i = 0; i <= numSamples; i += 1) {
          const t = startParam + (delta * i) / numSamples;
          const x = center.x + majorX * Math.cos(t) + minorX * Math.sin(t);
          const y = center.y + majorY * Math.cos(t) + minorY * Math.sin(t);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        return { minX, minY, maxX, maxY };
      }
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    case 'SOLID':
    case 'TRACE':
      if (geo.points && geo.points.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let hasValidPoint = false;
        for (const p of geo.points) {
          if (
            !p ||
            typeof p.x !== 'number' ||
            typeof p.y !== 'number' ||
            Number.isNaN(p.x) ||
            Number.isNaN(p.y)
          ) {
            continue;
          }
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
          hasValidPoint = true;
        }
        if (hasValidPoint) return { minX, minY, maxX, maxY };
      }
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    default:
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
}
