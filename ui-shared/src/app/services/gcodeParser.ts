// G 代码解析服务

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface GCodeCommand {
  type: 'RAPID' | 'LINEAR' | 'ARC_CW' | 'ARC_CCW' | 'OTHER';
  x?: number;
  y?: number;
  z?: number;
  i?: number;
  j?: number;
  r?: number;
  f?: number;
  raw: string;
  start: Point;
  end: Point;
  arcPoints?: Point[]; // 圆弧路径点
}

export interface GCodeParseResult {
  commands: GCodeCommand[];
  bbox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export class GCodeParser {
  private currentPos: Point = { x: 0, y: 0, z: 0 };
  private isAbsolute: boolean = true; // G90=绝对, G91=相对

  parse(gcode: string): GCodeParseResult {
    this.currentPos = { x: 0, y: 0, z: 0 };
    this.isAbsolute = true;

    const lines = gcode.split('\n');
    const commands: GCodeCommand[] = [];

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('(') || trimmed.startsWith(';')) {
        // 注释或空行
        continue;
      }

      const command = this.parseLine(trimmed);
      if (command) {
        commands.push(command);

        // 更新边界框
        minX = Math.min(minX, command.start.x, command.end.x);
        minY = Math.min(minY, command.start.y, command.end.y);
        maxX = Math.max(maxX, command.start.x, command.end.x);
        maxY = Math.max(maxY, command.start.y, command.end.y);
      }
    }

    return {
      commands,
      bbox: {
        minX: minX === Infinity ? 0 : minX,
        minY: minY === Infinity ? 0 : minY,
        maxX: maxX === -Infinity ? 0 : maxX,
        maxY: maxY === -Infinity ? 0 : maxY,
      }
    };
  }

  private parseLine(line: string): GCodeCommand | null {
    // 移除注释
    const cleanLine = line.split('(')[0].trim();
    if (!cleanLine) return null;

    // 提取 G 指令和参数
    const gMatch = cleanLine.match(/G(\d+)/);
    const gCode = gMatch ? parseInt(gMatch[1]) : null;

    // 解析坐标
    const xMatch = cleanLine.match(/X(-?\d+\.?\d*)/);
    const yMatch = cleanLine.match(/Y(-?\d+\.?\d*)/);
    const zMatch = cleanLine.match(/Z(-?\d+\.?\d*)/);
    const iMatch = cleanLine.match(/I(-?\d+\.?\d*)/);
    const jMatch = cleanLine.match(/J(-?\d+\.?\d*)/);
    const rMatch = cleanLine.match(/R(-?\d+\.?\d*)/);
    const fMatch = cleanLine.match(/F(-?\d+\.?\d*)/);

    const x = xMatch ? parseFloat(xMatch[1]) : undefined;
    const y = yMatch ? parseFloat(yMatch[1]) : undefined;
    const z = zMatch ? parseFloat(zMatch[1]) : undefined;
    const i = iMatch ? parseFloat(iMatch[1]) : undefined;
    const j = jMatch ? parseFloat(jMatch[1]) : undefined;
    const r = rMatch ? parseFloat(rMatch[1]) : undefined;
    const f = fMatch ? parseFloat(fMatch[1]) : undefined;

    const start = { ...this.currentPos };

    // 处理特殊 G 代码
    if (gCode === 0) {
      // G0 快速移动
      const command: GCodeCommand = {
        type: 'RAPID',
        x, y, z, f,
        raw: line,
        start: { ...start },
        end: {
          x: x !== undefined ? x : start.x,
          y: y !== undefined ? y : start.y,
          z: z !== undefined ? z : start.z,
        }
      };
      this.currentPos = { ...command.end };
      return command;
    }

    if (gCode === 1) {
      // G1 直线插补
      const command: GCodeCommand = {
        type: 'LINEAR',
        x, y, z, f,
        raw: line,
        start: { ...start },
        end: {
          x: x !== undefined ? x : start.x,
          y: y !== undefined ? y : start.y,
          z: z !== undefined ? z : start.z,
        }
      };
      this.currentPos = { ...command.end };
      return command;
    }

    if (gCode === 2) {
      // G2 顺时针圆弧
      const end = {
        x: x !== undefined ? x : start.x,
        y: y !== undefined ? y : start.y,
      };
      const arcPoints = this.generateArcPoints(start, end, i, j, r, false);
      const command: GCodeCommand = {
        type: 'ARC_CW',
        x, y, z, i, j, r, f,
        raw: line,
        start: { ...start },
        end,
        arcPoints,
      };
      this.currentPos = { ...command.end };
      return command;
    }

    if (gCode === 3) {
      // G3 逆时针圆弧
      const end = {
        x: x !== undefined ? x : start.x,
        y: y !== undefined ? y : start.y,
      };
      const arcPoints = this.generateArcPoints(start, end, i, j, r, true);
      const command: GCodeCommand = {
        type: 'ARC_CCW',
        x, y, z, i, j, r, f,
        raw: line,
        start: { ...start },
        end,
        arcPoints,
      };
      this.currentPos = { ...command.end };
      return command;
    }

    if (gCode === 90) {
      this.isAbsolute = true;
      return null;
    }

    if (gCode === 91) {
      this.isAbsolute = false;
      return null;
    }

    // 其他指令
    return {
      type: 'OTHER',
      raw: line,
      start: { ...start },
      end: { ...start },
    };
  }

  /**
   * 生成圆弧路径点
   */
  private generateArcPoints(
    start: Point,
    end: Point,
    i?: number,
    j?: number,
    r?: number,
    ccw: boolean = false
  ): Point[] {
    const points: Point[] = [start];

    let centerX: number, centerY: number;
    let startAngle: number, endAngle: number;
    let radius: number;

    if (i !== undefined && j !== undefined) {
      // 使用 I, J 参数（圆心相对于起点）
      centerX = start.x + i;
      centerY = start.y + j;
      radius = Math.sqrt(i * i + j * j);

      startAngle = Math.atan2(start.y - centerY, start.x - centerX);
      endAngle = Math.atan2(end.y - centerY, end.x - centerX);
    } else if (r !== undefined) {
      // 使用 R 参数（半径）
      const dist = Math.sqrt(
        Math.pow(end.x - start.x, 2) +
        Math.pow(end.y - start.y, 2)
      );

      if (dist > 2 * r) {
        // 圆弧半径不够
        return [start, end];
      }

      // 计算圆心
      const d = dist / 2;
      const h = Math.sqrt(r * r - d * d);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const perpAngle = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2;

      centerX = midX + h * Math.cos(perpAngle);
      centerY = midY + h * Math.sin(perpAngle);

      radius = r;
      startAngle = Math.atan2(start.y - centerY, start.x - centerX);
      endAngle = Math.atan2(end.y - centerY, end.x - centerX);
    } else {
      return [start, end];
    }

    // 生成圆弧点
    const segments = 20; // 圆弧分段数
    let angleDiff = endAngle - startAngle;

    // 根据顺时针/逆时针调整角度
    if (ccw) {
      // 逆时针
      if (angleDiff < 0) angleDiff += 2 * Math.PI;
    } else {
      // 顺时针
      if (angleDiff > 0) angleDiff -= 2 * Math.PI;
    }

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + angleDiff * t;
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }

    return points;
  }

  getCurrentPosition(): Point {
    return { ...this.currentPos };
  }

  reset(): void {
    this.currentPos = { x: 0, y: 0, z: 0 };
    this.isAbsolute = true;
  }
}

export const gcodeParser = new GCodeParser();
