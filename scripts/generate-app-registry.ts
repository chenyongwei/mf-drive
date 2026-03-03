import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const rootDir = path.resolve(process.cwd());
const registryPath = path.join(rootDir, 'registry', 'apps.yaml');
const outAppsDir = path.join(rootDir, 'generated', 'apps');
const outTypesDir = path.join(rootDir, 'generated', 'types');

const FOUNDATION_IAM_OPENAPI = path.join(rootDir, 'openapi', 'foundation-iam.yaml');
const FOUNDATION_ONTOLOGY_OPENAPI = path.join(rootDir, 'openapi', 'foundation-ontology.yaml');
const APP_ENUM_SCHEMA_FILES = [
  path.join(rootDir, 'schemas', 'http', 'foundation-security-policy-create-request.schema.json'),
  path.join(rootDir, 'schemas', 'http', 'foundation-security-policy-list-response.schema.json'),
  path.join(rootDir, 'schemas', 'http', 'foundation-security-policy-response.schema.json'),
  path.join(rootDir, 'schemas', 'http', 'foundation-security-pdp-evaluate-request.schema.json'),
  path.join(rootDir, 'schemas', 'http', 'foundation-security-pdp-evaluate-response.schema.json'),
  path.join(rootDir, 'schemas', 'http', 'foundation-security-relationship-revoke-response.schema.json'),
] as const;

const ONTOLOGY_DATA_DOMAINS = [
  'ORDER',
  'DRAWING',
  'NESTING',
  'INVENTORY',
  'FILE',
  'FOUNDATION_MODEL',
  'CUSTOMER',
  'SCHEDULING',
] as const;
const ONTOLOGY_PURPOSES = [
  'OPS_DISPATCH',
  'PRODUCTION_PLANNING',
  'QUALITY_TRACEABILITY',
  'SUPPLY_CHAIN_COLLAB',
  'FILE_ARCHIVAL',
  'ANALYTICS_REPORTING',
  'CUSTOMER_DELIVERY',
  'ALGORITHM_TRAINING',
] as const;
const ONTOLOGY_RETENTIONS = ['P7D', 'P30D', 'P90D', 'P180D'] as const;
const ONTOLOGY_REVOCATION_MODES = ['IMMEDIATE_CASCADE', 'SOFT_GRACE_24H'] as const;
const LAUNCH_MODES = ['MINI', 'NEW_WINDOW'] as const;

type LaunchMode = (typeof LAUNCH_MODES)[number];
type OntologyDataDomainV1 = (typeof ONTOLOGY_DATA_DOMAINS)[number];
type OntologyPurposeV1 = (typeof ONTOLOGY_PURPOSES)[number];
type OntologyRetentionV1 = (typeof ONTOLOGY_RETENTIONS)[number];
type OntologyRevocationModeV1 = (typeof ONTOLOGY_REVOCATION_MODES)[number];

type AppRegistryEntry = {
  appId: string;
  aliases: string[];
  name: string;
  route: string;
  clientId: string;
  requiredBaseScope: string;
  legacyConnectScope: string;
  launchMode: LaunchMode;
  miniSupported: boolean;
  enabledByUser: boolean;
  dock: {
    visible: boolean;
    order: number;
    icon: string;
  };
  marketplace: {
    category: string;
    tagline: string;
    shortDescription: string;
    longDescription: string;
    tags: string[];
    highlights: string[];
    screenshots: string[];
    version: string;
    ratingAverage: number;
    ratingCount: number;
    installCount: number;
    featured: boolean;
    updatedAt: string;
  };
  security: {
    recommendedTemplate: {
      dataDomain: OntologyDataDomainV1;
      purpose: OntologyPurposeV1;
      retention: OntologyRetentionV1;
      revocationMode: OntologyRevocationModeV1;
    };
  };
};

function toUnion(values: readonly string[]): string {
  return values.map((value) => JSON.stringify(value)).join(' | ');
}

function ensureRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

function ensureString(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${context} must be a non-empty string`);
  }
  return value.trim();
}

function ensureBoolean(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${context} must be a boolean`);
  }
  return value;
}

function ensureNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${context} must be a finite number`);
  }
  return value;
}

function ensureStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array`);
  }
  return value.map((entry, index) => ensureString(entry, `${context}[${index}]`));
}

function ensureEnum<T extends string>(value: unknown, allowed: readonly T[], context: string): T {
  const text = ensureString(value, context) as T;
  if (!allowed.includes(text)) {
    throw new Error(`${context} must be one of: ${allowed.join(', ')}`);
  }
  return text;
}

function normalizeRegistry(raw: unknown): AppRegistryEntry[] {
  const record = ensureRecord(raw, 'apps registry root');
  if (!Array.isArray(record.apps)) {
    throw new Error('apps registry root.apps must be an array');
  }

  const appIds = new Set<string>();
  const clientIds = new Set<string>();
  const dockOrders = new Set<number>();

  const entries = record.apps.map((entry, index) => {
    const base = ensureRecord(entry, `apps[${index}]`);
    const appId = ensureString(base.appId, `apps[${index}].appId`).toLowerCase();
    if (!/^[a-z][a-z0-9_]*$/.test(appId)) {
      throw new Error(`apps[${index}].appId must match ^[a-z][a-z0-9_]*$`);
    }
    if (appIds.has(appId)) {
      throw new Error(`duplicate appId: ${appId}`);
    }
    appIds.add(appId);

    const clientId = ensureString(base.clientId, `apps[${index}].clientId`);
    if (clientIds.has(clientId)) {
      throw new Error(`duplicate clientId: ${clientId}`);
    }
    clientIds.add(clientId);

    const aliases = Array.from(new Set(ensureStringArray(base.aliases ?? [], `apps[${index}].aliases`).map((value) => value.toLowerCase())));

    const dock = ensureRecord(base.dock, `apps[${index}].dock`);
    const dockOrder = ensureNumber(dock.order, `apps[${index}].dock.order`);
    if (dockOrders.has(dockOrder)) {
      throw new Error(`duplicate dock.order: ${dockOrder}`);
    }
    dockOrders.add(dockOrder);

    const marketplace = ensureRecord(base.marketplace, `apps[${index}].marketplace`);
    const security = ensureRecord(base.security, `apps[${index}].security`);
    const template = ensureRecord(security.recommendedTemplate, `apps[${index}].security.recommendedTemplate`);

    return {
      appId,
      aliases,
      name: ensureString(base.name, `apps[${index}].name`),
      route: ensureString(base.route, `apps[${index}].route`),
      clientId,
      requiredBaseScope: ensureString(base.requiredBaseScope, `apps[${index}].requiredBaseScope`),
      legacyConnectScope: ensureString(base.legacyConnectScope, `apps[${index}].legacyConnectScope`),
      launchMode: ensureEnum(base.launchMode, LAUNCH_MODES, `apps[${index}].launchMode`),
      miniSupported: ensureBoolean(base.miniSupported, `apps[${index}].miniSupported`),
      enabledByUser: ensureBoolean(base.enabledByUser, `apps[${index}].enabledByUser`),
      dock: {
        visible: ensureBoolean(dock.visible, `apps[${index}].dock.visible`),
        order: dockOrder,
        icon: ensureString(dock.icon, `apps[${index}].dock.icon`),
      },
      marketplace: {
        category: ensureString(marketplace.category, `apps[${index}].marketplace.category`),
        tagline: ensureString(marketplace.tagline, `apps[${index}].marketplace.tagline`),
        shortDescription: ensureString(marketplace.shortDescription, `apps[${index}].marketplace.shortDescription`),
        longDescription: ensureString(marketplace.longDescription, `apps[${index}].marketplace.longDescription`),
        tags: ensureStringArray(marketplace.tags, `apps[${index}].marketplace.tags`),
        highlights: ensureStringArray(marketplace.highlights, `apps[${index}].marketplace.highlights`),
        screenshots: ensureStringArray(marketplace.screenshots, `apps[${index}].marketplace.screenshots`),
        version: ensureString(marketplace.version, `apps[${index}].marketplace.version`),
        ratingAverage: ensureNumber(marketplace.ratingAverage, `apps[${index}].marketplace.ratingAverage`),
        ratingCount: ensureNumber(marketplace.ratingCount, `apps[${index}].marketplace.ratingCount`),
        installCount: ensureNumber(marketplace.installCount, `apps[${index}].marketplace.installCount`),
        featured: ensureBoolean(marketplace.featured, `apps[${index}].marketplace.featured`),
        updatedAt: ensureString(marketplace.updatedAt, `apps[${index}].marketplace.updatedAt`),
      },
      security: {
        recommendedTemplate: {
          dataDomain: ensureEnum(template.dataDomain, ONTOLOGY_DATA_DOMAINS, `apps[${index}].security.recommendedTemplate.dataDomain`),
          purpose: ensureEnum(template.purpose, ONTOLOGY_PURPOSES, `apps[${index}].security.recommendedTemplate.purpose`),
          retention: ensureEnum(template.retention, ONTOLOGY_RETENTIONS, `apps[${index}].security.recommendedTemplate.retention`),
          revocationMode: ensureEnum(template.revocationMode, ONTOLOGY_REVOCATION_MODES, `apps[${index}].security.recommendedTemplate.revocationMode`),
        },
      },
    } satisfies AppRegistryEntry;
  });

  if (entries.length === 0) {
    throw new Error('apps registry must include at least one app');
  }

  return entries;
}

async function syncOpenApiFoundationAppEnum(filePath: string, appIds: readonly string[]): Promise<void> {
  const source = await fs.readFile(filePath, 'utf8');
  const enumLiteral = `[${appIds.join(', ')}]`;
  const pattern = /(FoundationAppId:\s*\n\s*type:\s*string\s*\n\s*enum:\s*)\[[^\]]*\]/m;
  if (!pattern.test(source)) {
    throw new Error(`failed to locate FoundationAppId enum in ${path.relative(rootDir, filePath)}`);
  }
  const next = source.replace(pattern, `$1${enumLiteral}`);
  if (next !== source) {
    await fs.writeFile(filePath, next, 'utf8');
  }
}

function maybeReplaceAppEnum(value: unknown, appIds: readonly string[]): number {
  let replaced = 0;

  if (Array.isArray(value)) {
    for (const entry of value) {
      replaced += maybeReplaceAppEnum(entry, appIds);
    }
    return replaced;
  }

  if (!value || typeof value !== 'object') {
    return replaced;
  }

  const record = value as Record<string, unknown>;
  const enumValue = record.enum;
  if (Array.isArray(enumValue) && enumValue.length >= 3 && enumValue.every((item) => typeof item === 'string')) {
    const entries = enumValue as string[];
    const intersectionCount = appIds.filter((appId) => entries.includes(appId)).length;
    const lowerCaseLike = entries.every((item) => /^[a-z_]+$/.test(item));
    if (intersectionCount >= 3 && lowerCaseLike) {
      record.enum = [...appIds];
      replaced += 1;
    }
  }

  for (const child of Object.values(record)) {
    replaced += maybeReplaceAppEnum(child, appIds);
  }

  return replaced;
}

async function syncSchemaFoundationAppEnums(appIds: readonly string[]): Promise<void> {
  for (const filePath of APP_ENUM_SCHEMA_FILES) {
    const source = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(source) as unknown;
    const replaced = maybeReplaceAppEnum(parsed, appIds);
    if (replaced === 0) {
      throw new Error(`failed to update FoundationAppId enums in ${path.relative(rootDir, filePath)}`);
    }
    const next = `${JSON.stringify(parsed, null, 2)}\n`;
    if (next !== source) {
      await fs.writeFile(filePath, next, 'utf8');
    }
  }
}

async function writeGeneratedFiles(entries: AppRegistryEntry[]): Promise<void> {
  const appIds = entries.map((entry) => entry.appId);
  const appIdsLiteral = JSON.stringify(appIds, null, 2);
  const registryLiteral = JSON.stringify(entries, null, 2);

  const indexTs = `// Auto-generated by contracts/scripts/generate-app-registry.ts
// Do not edit manually.

export type FoundationAppId = ${toUnion(appIds)};
export type AppId = FoundationAppId;
export type LaunchMode = ${toUnion(LAUNCH_MODES)};
export type OntologyDataDomainV1 = ${toUnion(ONTOLOGY_DATA_DOMAINS)};
export type OntologyPurposeV1 = ${toUnion(ONTOLOGY_PURPOSES)};
export type OntologyRetentionV1 = ${toUnion(ONTOLOGY_RETENTIONS)};
export type OntologyRevocationModeV1 = ${toUnion(ONTOLOGY_REVOCATION_MODES)};

export type AppRecommendedTemplate = {
  dataDomain: OntologyDataDomainV1;
  purpose: OntologyPurposeV1;
  retention: OntologyRetentionV1;
  revocationMode: OntologyRevocationModeV1;
};

export type AppRegistryEntry = {
  appId: FoundationAppId;
  aliases: string[];
  name: string;
  route: string;
  clientId: string;
  requiredBaseScope: string;
  legacyConnectScope: string;
  launchMode: LaunchMode;
  miniSupported: boolean;
  enabledByUser: boolean;
  dock: {
    visible: boolean;
    order: number;
    icon: string;
  };
  marketplace: {
    category: string;
    tagline: string;
    shortDescription: string;
    longDescription: string;
    tags: string[];
    highlights: string[];
    screenshots: string[];
    version: string;
    ratingAverage: number;
    ratingCount: number;
    installCount: number;
    featured: boolean;
    updatedAt: string;
  };
  security: {
    recommendedTemplate: AppRecommendedTemplate;
  };
};

const FOUNDATION_APP_ID_SET = new Set<string>(${appIdsLiteral});

export const APP_REGISTRY = ${registryLiteral} as const satisfies readonly AppRegistryEntry[];

export const APP_IDS = APP_REGISTRY.map((entry) => entry.appId) as FoundationAppId[];

export const DOCK_APP_IDS = APP_REGISTRY
  .filter((entry) => entry.dock.visible)
  .sort((left, right) => left.dock.order - right.dock.order)
  .map((entry) => entry.appId) as FoundationAppId[];

export const APP_BY_ID = Object.freeze(
  APP_REGISTRY.reduce((acc, entry) => {
    acc[entry.appId] = entry;
    return acc;
  }, {} as Record<FoundationAppId, AppRegistryEntry>),
);

export const APP_ALIAS_MAP = Object.freeze(
  APP_REGISTRY.reduce((acc, entry) => {
    acc[entry.appId] = entry.appId;
    for (const alias of entry.aliases) {
      acc[alias.toLowerCase()] = entry.appId;
    }
    return acc;
  }, {} as Record<string, FoundationAppId>),
);

export const APP_RECOMMENDED_TEMPLATE_BY_ID = Object.freeze(
  APP_REGISTRY.reduce((acc, entry) => {
    acc[entry.appId] = entry.security.recommendedTemplate;
    return acc;
  }, {} as Record<FoundationAppId, AppRecommendedTemplate>),
);

export function isFoundationAppId(raw: unknown): raw is FoundationAppId {
  const normalized = String(raw ?? '').trim().toLowerCase();
  return FOUNDATION_APP_ID_SET.has(normalized);
}

export function parseFoundationAppId(raw: unknown): FoundationAppId | undefined {
  const normalized = String(raw ?? '').trim().toLowerCase();
  if (!normalized || !FOUNDATION_APP_ID_SET.has(normalized)) {
    return undefined;
  }
  return normalized as FoundationAppId;
}

export function resolveFoundationAppIdAlias(raw: unknown): FoundationAppId | undefined {
  const normalized = String(raw ?? '').trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return APP_ALIAS_MAP[normalized];
}

export function buildConnectScope(sourceAppId: FoundationAppId, targetAppId: FoundationAppId): string {
  return \`mf.connect.\${sourceAppId}.\${targetAppId}.read\`;
}
`;

  await fs.mkdir(outAppsDir, { recursive: true });
  await fs.mkdir(outTypesDir, { recursive: true });

  await fs.writeFile(path.join(outAppsDir, 'registry.json'), `${registryLiteral}\n`, 'utf8');
  await fs.writeFile(path.join(outAppsDir, 'index.ts'), indexTs, 'utf8');
  await fs.writeFile(
    path.join(outTypesDir, 'app-registry.ts'),
    [
      "export {",
      "  APP_REGISTRY,",
      "  APP_IDS,",
      "  DOCK_APP_IDS,",
      "  APP_BY_ID,",
      "  APP_ALIAS_MAP,",
      "  APP_RECOMMENDED_TEMPLATE_BY_ID,",
      "  isFoundationAppId,",
      "  parseFoundationAppId,",
      "  resolveFoundationAppIdAlias,",
      "  buildConnectScope,",
      "  type AppId,",
      "  type LaunchMode,",
      "  type OntologyPurposeV1,",
      "  type OntologyRetentionV1,",
      "  type OntologyRevocationModeV1,",
      "  type AppRecommendedTemplate,",
      "  type AppRegistryEntry,",
      "} from '../apps/index';",
      '',
    ].join('\n'),
    'utf8',
  );
}

async function main(): Promise<void> {
  const raw = parseYaml(await fs.readFile(registryPath, 'utf8'));
  const entries = normalizeRegistry(raw);
  const appIds = entries.map((entry) => entry.appId);

  await writeGeneratedFiles(entries);
  await syncOpenApiFoundationAppEnum(FOUNDATION_IAM_OPENAPI, appIds);
  await syncOpenApiFoundationAppEnum(FOUNDATION_ONTOLOGY_OPENAPI, appIds);
  await syncSchemaFoundationAppEnums(appIds);

  console.log(`[generate-app-registry] generated ${entries.length} apps`);
}

main().catch((error) => {
  console.error('[generate-app-registry] failed:', error);
  process.exit(1);
});
