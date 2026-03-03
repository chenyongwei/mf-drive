// ==================== 认证与团队类型 ====================

export type TeamRole = "owner" | "admin" | "member";

export type PermissionKey =
  | "VIEW_PARTS"
  | "ADD_PARTS"
  | "EDIT_PARTS"
  | "DELETE_PARTS"
  | "VIEW_NESTING"
  | "RUN_NESTING"
  | "EDIT_NESTING"
  | "DELETE_NESTING"
  | "EXPORT_NC"
  | "VIEW_REPORTS"
  | "GENERATE_REPORTS"
  | "MANAGE_MEMBERS"
  | "MANAGE_PERMISSIONS"
  | "VIEW_DRAWINGS"
  | "EDIT_DRAWINGS"
  | "MANAGE_DRAWINGS";

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface Team {
  id: number;
  teamCode: string;
  name: string;
  ownerId: number;
  dbSizeLimitMB: number;
  currentDbSizeMB: number;
  createdAt: Date;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: TeamRole;
  joinedAt: Date;
}

export interface MemberPermission {
  id: number;
  memberId: number;
  permissionKey: PermissionKey;
  allowed: boolean;
  createdAt: Date;
}

export interface WorkspaceContext {
  userId: number;
  teamId?: number; // undefined = personal workspace
  role?: TeamRole;
  permissions?: PermissionKey[];
  dbName: string; // Resolved database name
}

export interface DatabaseSizeInfo {
  currentSizeMB: number;
  sizeLimitMB: number;
  usagePercent: number;
}
