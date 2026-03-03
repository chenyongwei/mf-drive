import { seedFiles, seedParts, seedTeams, seedUsers } from './compatState.seed';
import type { CompatNestingJob, CompatUser } from './compatState.types';

export type {
  CompatFile,
  CompatPart,
  CompatTeam,
  CompatUser,
  CompatNestingJob,
} from './compatState.types';

const nowIso = () => new Date().toISOString();

export const compatState = {
  users: [...seedUsers],
  teams: [...seedTeams],
  files: [...seedFiles],
  parts: [...seedParts],
  nestingJobs: [] as CompatNestingJob[],
  gcodeConfigs: [
    {
      id: 'cfg-1',
      name: 'Default Laser',
      deviceType: 'laser',
      kerfCompensation: 0.15,
      feedRate: 1200,
    },
  ],
  activeUserId: 1,
  activeWorkspace: { type: 'team' as const, teamId: 1 },
  sequence: {
    user: 10,
    team: 10,
    file: 10,
    nesting: 10,
    gcode: 10,
  },
  activities: [] as Array<{
    id: number;
    action: string;
    user_email: string;
    resource_type?: string;
    resource_id?: string | number;
    ip_address?: string;
    created_at: string;
  }>,
};

export function nextId(kind: keyof typeof compatState.sequence): number {
  compatState.sequence[kind] += 1;
  return compatState.sequence[kind];
}

export function currentUser(): CompatUser | null {
  return compatState.users.find((u) => u.id === compatState.activeUserId) ?? null;
}

export function requireUser() {
  const user = currentUser();
  if (!user) {
    return { error: true as const, status: 401, body: { error: 'Not authenticated' } };
  }
  return { error: false as const, user };
}

export function recordActivity(action: string, resourceType?: string, resourceId?: string | number): void {
  const user = currentUser();
  compatState.activities.unshift({
    id: Date.now(),
    action,
    user_email: user?.email ?? 'unknown@example.com',
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: '127.0.0.1',
    created_at: nowIso(),
  });
  if (compatState.activities.length > 200) {
    compatState.activities.length = 200;
  }
}

export function createMockLayout(jobId: string) {
  return {
    id: `layout-${jobId}`,
    utilization: 0.78,
    placedParts: compatState.parts.slice(0, 2).map((part, idx) => ({
      partId: part.id,
      x: 120 + idx * 260,
      y: 120 + idx * 60,
      rotation: idx % 2 === 0 ? 0 : 90,
    })),
  };
}
