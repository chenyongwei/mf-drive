import type {
  CompatFile,
  CompatPart,
  CompatTeam,
  CompatUser,
} from './compatState.types';
import { seedParts } from './compatState.parts.seed';

const nowIso = () => new Date().toISOString();

const seedFileParts: CompatPart[] = seedParts.filter((part) => part.fileId === 'file-1');

export const seedFiles: CompatFile[] = [
  {
    id: 'file-1',
    name: 'sample-frame.dxf',
    status: 'ready',
    progress: 100,
    entityCount: 182,
    partCount: seedFileParts.length,
    parts: seedFileParts,
    expanded: true,
    createdAt: nowIso(),
  },
];

export const seedUsers: CompatUser[] = [
  {
    id: 1,
    email: 'admin@example.com',
    password: 'admin123',
    isActive: true,
    isVerified: true,
    createdAt: nowIso(),
    adminRole: 'super_admin',
  },
  {
    id: 2,
    email: 'operator@example.com',
    password: 'operator123',
    isActive: true,
    isVerified: true,
    createdAt: nowIso(),
    adminRole: null,
  },
];

export const seedTeams: CompatTeam[] = [
  {
    id: 1,
    name: 'Factory Alpha',
    teamCode: 'ALPHA',
    ownerId: 1,
    memberIds: [1, 2],
    createdAt: nowIso(),
    storageLimitMB: 1024,
    storageUsedMB: 412,
  },
];

export { seedParts };
