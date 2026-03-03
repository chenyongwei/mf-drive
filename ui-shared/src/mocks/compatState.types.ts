export type CompatUser = {
  id: number;
  email: string;
  password: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  adminRole: "super_admin" | "admin" | null;
};

export type CompatTeam = {
  id: number;
  name: string;
  teamCode: string;
  ownerId: number;
  memberIds: number[];
  createdAt: string;
  storageLimitMB: number;
  storageUsedMB: number;
};

export type CompatPart = {
  id: string;
  fileId: string;
  name: string;
  area: number;
  quantity?: number;
  contour: Array<{ x: number; y: number }>;
  partId?: string;
  originalName?: string;
  originalFilename?: string;
  processCode?: string;
  entityCount?: number;
  createdAt?: string;
  bbox?: { minX: number; minY: number; maxX: number; maxY: number };
  geometry?: {
    boundingBox?: { minX: number; minY: number; maxX: number; maxY: number };
    area?: number;
  };
  entities?: Array<Record<string, unknown>>;
};

export type CompatFile = {
  id: string;
  name: string;
  status: "uploading" | "parsing" | "ready" | "error";
  progress: number;
  entityCount: number;
  partCount: number;
  parts: CompatPart[];
  expanded?: boolean;
  createdAt: string;
};

export type CompatNestingJob = {
  nestingId: string;
  status: "queued" | "running" | "completed" | "stopped";
  progress: number;
  currentUtilization: number;
  currentLayout?: {
    id: string;
    utilization: number;
    placedParts: Array<{
      partId: string;
      x: number;
      y: number;
      rotation: number;
    }>;
  };
};
