export class Node {
  i: number;
  x: number;
  y: number;
  prev: Node | null = null;
  next: Node | null = null;
  z: number | null = null;
  prevZ: Node | null = null;
  nextZ: Node | null = null;
  steiner = false;

  constructor(i: number, x: number, y: number) {
    this.i = i;
    this.x = x;
    this.y = y;
  }
}

export function area(p: Node, q: Node, r: Node): number {
  return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

export function pointInTriangle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  px: number,
  py: number,
): boolean {
  return (
    (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
    (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
    (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0
  );
}

function sign(num: number): number {
  return num > 0 ? 1 : num < 0 ? -1 : 0;
}

function onSegment(p: Node, i: Node, q: Node): boolean {
  return (
    i.x <= Math.max(p.x, q.x) &&
    i.x >= Math.min(p.x, q.x) &&
    i.y <= Math.max(p.y, q.y) &&
    i.y >= Math.min(p.y, q.y)
  );
}

export function intersects(p1: Node, q1: Node, p2: Node, q2: Node): boolean {
  const o1 = sign(area(p1, q1, p2));
  const o2 = sign(area(p1, q1, q2));
  const o3 = sign(area(p2, q2, p1));
  const o4 = sign(area(p2, q2, q1));
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  return false;
}

function intersectsPolygon(a: Node, b: Node): boolean {
  let p = a;
  do {
    if (
      p.i !== a.i &&
      p.next!.i !== a.i &&
      p.i !== b.i &&
      p.next!.i !== b.i &&
      intersects(p, p.next!, a, b)
    ) {
      return true;
    }
    p = p.next!;
  } while (p !== a);
  return false;
}

export function locallyInside(a: Node, b: Node): boolean {
  return area(a.prev!, a, a.next!) < 0
    ? area(a, b, a.next!) >= 0 && area(a, a.prev!, b) >= 0
    : area(a, b, a.prev!) < 0 || area(a, a.next!, b) < 0;
}

function middleInside(a: Node, b: Node): boolean {
  let p = a;
  let inside = false;
  const px = (a.x + b.x) / 2;
  const py = (a.y + b.y) / 2;
  do {
    if (
      (p.y > py) !== (p.next!.y > py) &&
      p.next!.y !== p.y &&
      px < ((p.next!.x - p.x) * (py - p.y)) / (p.next!.y - p.y) + p.x
    ) {
      inside = !inside;
    }
    p = p.next!;
  } while (p !== a);
  return inside;
}

export function isValidDiagonal(a: Node, b: Node): boolean {
  return (
    a.next!.i !== b.i &&
    a.prev!.i !== b.i &&
    !intersectsPolygon(a, b) &&
    ((locallyInside(a, b) &&
      locallyInside(b, a) &&
      middleInside(a, b) &&
      (area(a.prev!, a, b.prev!) !== 0 || area(a, b.prev!, b) !== 0)) ||
      (equals(a, b) &&
        area(a.prev!, a, a.next!) > 0 &&
        area(b.prev!, b, b.next!) > 0))
  );
}

export function splitPolygon(a: Node, b: Node): Node {
  const a2 = new Node(a.i, a.x, a.y);
  const b2 = new Node(b.i, b.x, b.y);
  const an = a.next!;
  const bp = b.prev!;

  a.next = b;
  b.prev = a;
  a2.next = an;
  an.prev = a2;
  b2.prev = bp;
  bp.next = b2;
  a2.prev = b2;
  b2.next = a2;
  return b2;
}

export function insertNode(i: number, x: number, y: number, last: Node | null): Node {
  const p = new Node(i, x, y);
  if (!last) {
    p.prev = p;
    p.next = p;
  } else {
    p.next = last.next;
    p.prev = last;
    last.next!.prev = p;
    last.next = p;
  }
  return p;
}

export function removeNode(p: Node): void {
  p.next!.prev = p.prev;
  p.prev!.next = p.next;
  if (p.prevZ) p.prevZ.nextZ = p.nextZ;
  if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

export function signedArea(data: number[], start: number, end: number, dim: number): number {
  let sum = 0;
  for (let i = start, j = end - dim; i < end; i += dim) {
    sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
    j = i;
  }
  return sum;
}

export function equals(p1: Node, p2: Node): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}
