import {
  area,
  equals,
  intersects,
  isValidDiagonal,
  locallyInside,
  Node,
  pointInTriangle,
  removeNode,
  splitPolygon,
} from './earcut.node';
import { filterPoints } from './earcut.list';

function zOrder(x: number, y: number, minX: number, minY: number, invSize: number): number {
  x = 32767 * (x - minX) * invSize;
  y = 32767 * (y - minY) * invSize;

  x = (x | (x << 8)) & 0x00ff00ff;
  x = (x | (x << 4)) & 0x0f0f0f0f;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y = (y | (y << 8)) & 0x00ff00ff;
  y = (y | (y << 4)) & 0x0f0f0f0f;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

function sortLinked(list: Node | null): Node | null {
  let i: number;
  let p: Node | null;
  let q: Node | null;
  let e: Node | null;
  let tail: Node | null;
  let numMerges: number;
  let pSize: number;
  let qSize: number;
  let inSize = 1;

  do {
    p = list;
    list = null;
    tail = null;
    numMerges = 0;

    while (p) {
      numMerges += 1;
      q = p;
      pSize = 0;
      for (i = 0; i < inSize; i += 1) {
        pSize += 1;
        q = q.nextZ!;
        if (!q) break;
      }
      qSize = inSize;

      while (pSize > 0 || (qSize > 0 && q)) {
        if (pSize === 0) {
          e = q;
          q = q!.nextZ!;
          qSize -= 1;
        } else if (qSize === 0 || !q) {
          e = p;
          p = p.nextZ!;
          pSize -= 1;
        } else if (p.z! <= q.z!) {
          e = p;
          p = p.nextZ!;
          pSize -= 1;
        } else {
          e = q;
          q = q.nextZ!;
          qSize -= 1;
        }

        if (tail) tail.nextZ = e;
        else list = e;
        e!.prevZ = tail;
        tail = e;
      }
      p = q;
    }

    tail!.nextZ = null;
    inSize *= 2;
  } while (numMerges > 1);

  return list;
}

function indexCurve(start: Node, minX: number, minY: number, invSize: number): void {
  let p = start;
  do {
    if (p.z === 0) p.z = zOrder(p.x, p.y, minX, minY, invSize);
    p.prevZ = p.prev;
    p.nextZ = p.next;
    p = p.next!;
  } while (p !== start);

  p.prevZ!.nextZ = null;
  p.prevZ = null;
  sortLinked(p);
}

function isEar(ear: Node): boolean {
  const a = ear.prev!;
  const b = ear;
  const c = ear.next!;
  if (area(a, b, c) >= 0) return false;

  let p = ear.next!.next!;
  while (p !== ear.prev) {
    if (
      pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
      area(p.prev!, p, p.next!) >= 0
    ) {
      return false;
    }
    p = p.next!;
  }
  return true;
}

function isEarHashed(ear: Node, minX: number, minY: number, invSize: number): boolean {
  const a = ear.prev!;
  const b = ear;
  const c = ear.next!;
  if (area(a, b, c) >= 0) return false;

  const minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : b.x < c.x ? b.x : c.x;
  const minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : b.y < c.y ? b.y : c.y;
  const maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : b.x > c.x ? b.x : c.x;
  const maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : b.y > c.y ? b.y : c.y;

  const minZ = zOrder(minTX, minTY, minX, minY, invSize);
  const maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

  let p = ear.prevZ;
  let n = ear.nextZ;

  while (p && p.z! >= minZ && n && n.z! <= maxZ) {
    if (
      p !== ear.prev &&
      p !== ear.next &&
      pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
      area(p.prev!, p, p.next!) >= 0
    ) {
      return false;
    }
    p = p.prevZ;

    if (
      n !== ear.prev &&
      n !== ear.next &&
      pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
      area(n.prev!, n, n.next!) >= 0
    ) {
      return false;
    }
    n = n.nextZ;
  }

  while (p && p.z! >= minZ) {
    if (
      p !== ear.prev &&
      p !== ear.next &&
      pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
      area(p.prev!, p, p.next!) >= 0
    ) {
      return false;
    }
    p = p.prevZ;
  }

  while (n && n.z! <= maxZ) {
    if (
      n !== ear.prev &&
      n !== ear.next &&
      pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
      area(n.prev!, n, n.next!) >= 0
    ) {
      return false;
    }
    n = n.nextZ;
  }

  return true;
}

function cureLocalIntersections(start: Node | null, triangles: number[], dim: number): Node | null {
  let p = start!;
  do {
    const a = p.prev!;
    const b = p.next!.next!;
    if (!equals(a, b) && intersects(a, p, p.next!, b) && locallyInside(a, b) && locallyInside(b, a)) {
      triangles.push((a.i / dim) | 0);
      triangles.push((p.i / dim) | 0);
      triangles.push((b.i / dim) | 0);
      removeNode(p);
      removeNode(p.next!);
      p = start = b;
    }
    p = p.next!;
  } while (p !== start);
  return filterPoints(p);
}

function splitEarcut(
  start: Node | null,
  triangles: number[],
  dim: number,
  minX: number,
  minY: number,
  invSize: number,
): void {
  let a = start!;
  do {
    let b = a.next!.next!;
    while (b !== a.prev) {
      if (a.i !== b.i && isValidDiagonal(a, b)) {
        const c = splitPolygon(a, b);
        a = filterPoints(a, a.next)!;
        const cFiltered = filterPoints(c, c.next)!;
        earcutLinked(a, triangles, dim, minX, minY, invSize);
        earcutLinked(cFiltered, triangles, dim, minX, minY, invSize);
        return;
      }
      b = b.next!;
    }
    a = a.next!;
  } while (a !== start);
}

export function earcutLinked(
  ear: Node | null,
  triangles: number[],
  dim: number,
  minX: number,
  minY: number,
  invSize: number,
  pass = 0,
): void {
  if (!ear) return;
  if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

  let stop = ear;
  let prev: Node;
  let next: Node;
  while (ear!.prev !== ear!.next) {
    prev = ear!.prev!;
    next = ear!.next!;

    if (invSize ? isEarHashed(ear!, minX, minY, invSize) : isEar(ear!)) {
      triangles.push((prev.i / dim) | 0, (ear!.i / dim) | 0, (next.i / dim) | 0);
      removeNode(ear!);
      ear = next.next;
      stop = next.next!;
      continue;
    }

    ear = next;
    if (ear === stop) {
      if (!pass) {
        earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);
      } else if (pass === 1) {
        ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
        earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
      } else if (pass === 2) {
        splitEarcut(ear, triangles, dim, minX, minY, invSize);
      }
      break;
    }
  }
}
