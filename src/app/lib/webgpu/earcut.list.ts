import {
  area,
  equals,
  insertNode,
  locallyInside,
  Node,
  pointInTriangle,
  removeNode,
  signedArea,
  splitPolygon,
} from './earcut.node';

export function linkedList(
  data: number[],
  start: number,
  end: number,
  dim: number,
  clockwise: boolean,
): Node | null {
  let i: number;
  let last: Node | null = null;

  if (clockwise === (signedArea(data, start, end, dim) > 0)) {
    for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
  } else {
    for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
  }

  if (last && equals(last, last.next!)) {
    removeNode(last);
    last = last.next;
  }
  return last;
}

export function filterPoints(start: Node | null, end: Node | null = null): Node | null {
  if (!start) return start;
  if (!end) end = start;

  let p = start;
  let again: boolean;
  do {
    again = false;
    if (!p.steiner && (equals(p, p.next!) || area(p.prev!, p, p.next!) === 0)) {
      removeNode(p);
      p = end = p.prev!;
      if (p === p.next) break;
      again = true;
    } else {
      p = p.next!;
    }
  } while (again || p !== end);

  return end;
}

function compareX(a: Node, b: Node): number {
  return a.x - b.x;
}

function getLeftmost(start: Node): Node {
  let p = start;
  let leftmost = start;
  do {
    if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
    p = p.next!;
  } while (p !== start);
  return leftmost;
}

function sectorContainsSector(m: Node, p: Node): boolean {
  return area(m.prev!, m, p.prev!) < 0 && area(p.next!, m, m.next!) < 0;
}

function findHoleBridge(hole: Node, outerNode: Node): Node {
  let p = outerNode;
  const hx = hole.x;
  const hy = hole.y;
  let qx = -Infinity;
  let m: Node | null = null;

  do {
    if (hy <= p.y && hy >= p.next!.y && p.next!.y !== p.y) {
      const x = p.x + ((hy - p.y) * (p.next!.x - p.x)) / (p.next!.y - p.y);
      if (x <= hx && x > qx) {
        qx = x;
        if (x === hx) {
          if (hy === p.y) return p;
          if (hy === p.next!.y) return p.next!;
        }
        m = p.x < p.next!.x ? p : p.next!;
      }
    }
    p = p.next!;
  } while (p !== outerNode);

  if (!m) return outerNode;
  if (hx === qx) return m;

  const stop = m;
  const mx = m.x;
  const my = m.y;
  let tanMin = Infinity;
  let tan: number;
  p = m;

  do {
    if (
      hx >= p.x &&
      p.x >= mx &&
      hx !== p.x &&
      pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)
    ) {
      tan = Math.abs(hy - p.y) / (hx - p.x);
      if (
        locallyInside(p, hole) &&
        (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))
      ) {
        m = p;
        tanMin = tan;
      }
    }
    p = p.next!;
  } while (p !== stop);

  return m;
}

function eliminateHole(hole: Node, outerNode: Node): Node {
  outerNode = findHoleBridge(hole, outerNode);
  if (outerNode) {
    const b = splitPolygon(outerNode, hole);
    filterPoints(outerNode, outerNode.next);
    filterPoints(b, b.next);
  }
  return outerNode;
}

export function eliminateHoles(
  data: number[],
  holeIndices: number[],
  outerNode: Node | null,
  dim: number,
): Node | null {
  const queue: Node[] = [];
  let i: number;
  let len: number;
  let start: number;
  let end: number;
  let list: Node | null;

  for (i = 0, len = holeIndices.length; i < len; i += 1) {
    start = holeIndices[i] * dim;
    end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
    list = linkedList(data, start, end, dim, false);
    if (list === list!.next) list!.steiner = true;
    queue.push(getLeftmost(list!));
  }

  queue.sort(compareX);
  for (i = 0; i < queue.length; i += 1) {
    outerNode = eliminateHole(queue[i], outerNode!);
    outerNode = filterPoints(outerNode, outerNode.next)!;
  }
  return outerNode;
}
