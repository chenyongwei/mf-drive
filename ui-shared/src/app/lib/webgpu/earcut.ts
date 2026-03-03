/**
 * ISC License
 *
 * Copyright (c) 2016, Mapbox
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted, provided that the above copyright notice
 * and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
 * OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
 * TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
 * THIS SOFTWARE.
 */

import { Node } from './earcut.node';
import { eliminateHoles, linkedList } from './earcut.list';
import { earcutLinked } from './earcut.triangulation';

// Ported to TypeScript for dxf-fix project
export default function earcut(
  data: number[],
  holeIndices: number[] = [],
  dim = 2,
): number[] {
  const hasHoles = holeIndices && holeIndices.length;
  const outerLen = hasHoles ? holeIndices[0] * dim : data.length;
  let outerNode: Node | null = linkedList(data, 0, outerLen, dim, true);
  const triangles: number[] = [];

  if (!outerNode || outerNode.prev === outerNode.next) {
    return triangles;
  }

  let minX = 0;
  let minY = 0;
  let invSize = 0;

  if (hasHoles) {
    outerNode = eliminateHoles(data, holeIndices, outerNode, dim);
  }

  if (data.length > 80 * dim) {
    minX = data[0];
    minY = data[1];
    let maxX = data[0];
    let maxY = data[1];

    for (let i = dim; i < outerLen; i += dim) {
      const x = data[i];
      const y = data[i + 1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    invSize = Math.max(maxX - minX, maxY - minY);
    invSize = invSize !== 0 ? 32767 / invSize : 0;
  }

  earcutLinked(outerNode, triangles, dim, minX, minY, invSize);
  return triangles;
}
