import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { parse as parseYaml } from 'yaml';

const rootDir = path.resolve(process.cwd());

const requiredPaths = [
  'openapi/ordering.yaml',
  'openapi/drawing.yaml',
  'openapi/nesting.yaml',
  'openapi/aps.yaml',
  'openapi/crm.yaml',
  'openapi/drive.yaml',
  'openapi/foundation-iam.yaml',
  'openapi/foundation-ontology.yaml',
  'openapi/foundation-bom.yaml',
  'openapi/foundation-material.yaml',
  'openapi/foundation-mcp.yaml',
  'openapi/wms.yaml',
  'ontology/object-types.yaml',
  'ontology/link-types.yaml',
  'ontology/actions.yaml',
  'ontology/registry.yaml',
  'registry/apps.yaml',
  'registry/resource-packs.yaml',
  'asyncapi/events.yaml',
  'schemas/http',
  'schemas/events',
  'mock-data/http',
  'mock-data/events',
  'profiles/base.yaml',
  'profiles/demo.yaml',
  'profiles/edge.yaml',
  'profiles/failure.yaml',
  'generated/types/http.ts',
  'generated/types/events.ts',
  'generated/types/ontology.ts',
  'generated/types/resource-packs.ts',
  'generated/types/app-registry.ts',
  'generated/types/index.ts',
  'generated/apps/index.ts',
  'generated/apps/registry.json',
  'scripts/generate-types.ts',
  'scripts/generate-app-registry.ts',
  'scripts/generate-resource-pack-types.ts',
  'scripts/generate-ontology-types.ts',
  'scripts/validate-contracts.ts',
  'scripts/check-breaking.ts',
];

async function fileExists(relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(rootDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(full)));
    } else {
      files.push(full);
    }
  }
  return files.sort();
}

async function readJson(filePath: string): Promise<any> {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function rel(filePath: string): string {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

async function validateOpenApi(openapiPath: string, errors: string[]) {
  const parsed = parseYaml(await fs.readFile(openapiPath, 'utf8'));
  if (!parsed || typeof parsed !== 'object') {
    errors.push(`${rel(openapiPath)}: invalid yaml object`);
    return;
  }
  if (!parsed.openapi) {
    errors.push(`${rel(openapiPath)}: missing openapi field`);
  }
  if (!parsed.info || !parsed.info.title || !parsed.info.version) {
    errors.push(`${rel(openapiPath)}: missing info.title/info.version`);
  }
  if (!parsed.paths || typeof parsed.paths !== 'object') {
    errors.push(`${rel(openapiPath)}: missing paths object`);
  }
}

async function validateAsyncApi(asyncApiPath: string, errors: string[]) {
  const parsed = parseYaml(await fs.readFile(asyncApiPath, 'utf8'));
  if (!parsed || typeof parsed !== 'object') {
    errors.push(`${rel(asyncApiPath)}: invalid yaml object`);
    return;
  }
  if (!parsed.asyncapi) {
    errors.push(`${rel(asyncApiPath)}: missing asyncapi field`);
  }
  if (!parsed.info || !parsed.info.title || !parsed.info.version) {
    errors.push(`${rel(asyncApiPath)}: missing info.title/info.version`);
  }
  if (!parsed.channels || typeof parsed.channels !== 'object') {
    errors.push(`${rel(asyncApiPath)}: missing channels object`);
  }
}

function parseFoundationAppIdsFromOpenApi(parsedOpenApi: any): string[] {
  const enumValues = parsedOpenApi?.components?.schemas?.FoundationAppId?.enum;
  if (!Array.isArray(enumValues)) {
    return [];
  }
  return enumValues.map((entry: unknown) => String(entry));
}

async function validateAppRegistry(errors: string[]) {
  const registryPath = path.join(rootDir, 'registry', 'apps.yaml');
  const parsed = parseYaml(await fs.readFile(registryPath, 'utf8'));
  const root = asRecord(parsed);
  if (!root || !Array.isArray(root.apps)) {
    errors.push('registry/apps.yaml: root.apps must be an array');
    return;
  }

  const requiredRootFields = [
    'appId',
    'name',
    'route',
    'clientId',
    'requiredBaseScope',
    'legacyConnectScope',
    'launchMode',
    'miniSupported',
    'enabledByUser',
    'dock',
    'marketplace',
    'security',
  ];
  const requiredDockFields = ['visible', 'order', 'icon'];
  const requiredMarketplaceFields = [
    'category',
    'tagline',
    'shortDescription',
    'longDescription',
    'tags',
    'highlights',
    'screenshots',
    'version',
    'ratingAverage',
    'ratingCount',
    'installCount',
    'featured',
    'updatedAt',
  ];
  const requiredTemplateFields = ['dataDomain', 'purpose', 'retention', 'revocationMode'];

  const appIds = new Set<string>();
  const clientIds = new Set<string>();
  const dockOrders = new Set<number>();

  root.apps.forEach((entry: unknown, index: number) => {
    const app = asRecord(entry);
    if (!app) {
      errors.push(`registry/apps.yaml: apps[${index}] must be an object`);
      return;
    }

    for (const field of requiredRootFields) {
      if (!(field in app)) {
        errors.push(`registry/apps.yaml: apps[${index}] missing field ${field}`);
      }
    }

    const appId = String(app.appId ?? '').trim();
    if (!appId) {
      errors.push(`registry/apps.yaml: apps[${index}].appId must be non-empty`);
    } else if (appIds.has(appId)) {
      errors.push(`registry/apps.yaml: duplicated appId ${appId}`);
    } else {
      appIds.add(appId);
    }

    const clientId = String(app.clientId ?? '').trim();
    if (!clientId) {
      errors.push(`registry/apps.yaml: apps[${index}].clientId must be non-empty`);
    } else if (clientIds.has(clientId)) {
      errors.push(`registry/apps.yaml: duplicated clientId ${clientId}`);
    } else {
      clientIds.add(clientId);
    }

    const dock = asRecord(app.dock);
    if (!dock) {
      errors.push(`registry/apps.yaml: apps[${index}].dock must be an object`);
    } else {
      for (const field of requiredDockFields) {
        if (!(field in dock)) {
          errors.push(`registry/apps.yaml: apps[${index}].dock missing field ${field}`);
        }
      }
      if (typeof dock.order === 'number' && Number.isFinite(dock.order)) {
        if (dockOrders.has(dock.order)) {
          errors.push(`registry/apps.yaml: duplicated dock.order ${dock.order}`);
        } else {
          dockOrders.add(dock.order);
        }
      }
    }

    const marketplace = asRecord(app.marketplace);
    if (!marketplace) {
      errors.push(`registry/apps.yaml: apps[${index}].marketplace must be an object`);
    } else {
      for (const field of requiredMarketplaceFields) {
        if (!(field in marketplace)) {
          errors.push(`registry/apps.yaml: apps[${index}].marketplace missing field ${field}`);
        }
      }
    }

    const security = asRecord(app.security);
    const template = asRecord(security?.recommendedTemplate);
    if (!template) {
      errors.push(`registry/apps.yaml: apps[${index}].security.recommendedTemplate must be an object`);
    } else {
      for (const field of requiredTemplateFields) {
        if (!(field in template)) {
          errors.push(`registry/apps.yaml: apps[${index}].security.recommendedTemplate missing field ${field}`);
        }
      }
    }
  });

  const foundationIam = parseYaml(await fs.readFile(path.join(rootDir, 'openapi', 'foundation-iam.yaml'), 'utf8'));
  const foundationOntology = parseYaml(await fs.readFile(path.join(rootDir, 'openapi', 'foundation-ontology.yaml'), 'utf8'));
  const registryAppIds = [...appIds].sort();
  const iamAppIds = parseFoundationAppIdsFromOpenApi(foundationIam).sort();
  const ontologyAppIds = parseFoundationAppIdsFromOpenApi(foundationOntology).sort();

  if (registryAppIds.join(',') !== iamAppIds.join(',')) {
    errors.push('registry/apps.yaml: FoundationAppId mismatch with openapi/foundation-iam.yaml');
  }
  if (registryAppIds.join(',') !== ontologyAppIds.join(',')) {
    errors.push('registry/apps.yaml: FoundationAppId mismatch with openapi/foundation-ontology.yaml');
  }
}

async function validateProfiles(errors: string[]) {
  const profileDir = path.join(rootDir, 'profiles');
  const files = (await listFiles(profileDir)).filter((file) => file.endsWith('.yaml'));
  for (const file of files) {
    const parsed = parseYaml(await fs.readFile(file, 'utf8'));
    const requiredKeys = ['name', 'http', 'events', 'failureInjection'];
    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        errors.push(`${rel(file)}: missing key ${key}`);
      }
    }
  }
}

async function validateMockDataLayout(errors: string[]) {
  const scenarios = ['base', 'demo', 'edge', 'failure'];
  const httpServices = [
    'ordering',
    'drawing',
    'nesting',
    'aps',
    'crm',
    'drive',
    'foundation-iam',
    'foundation-bom',
    'foundation-material',
    'foundation-mcp',
    'wms',
  ];
  const eventTypes = [
    'drawing.parts.ready',
    'nesting.job.completed',
    'ordering.order.updated',
    'foundation.bom.version.pending',
    'foundation.bom.version.adopted',
    'foundation.bom.version.rejected',
    'foundation.sheet.reservation.created',
    'foundation.sheet.consumption.committed',
    'foundation.sheet.consumption.rolledback',
    'foundation.inventory.synced',
  ];

  for (const service of httpServices) {
    for (const scenario of scenarios) {
      const dir = path.join(rootDir, 'mock-data', 'http', service, scenario);
      if (!(await fileExists(rel(dir)))) {
        errors.push(`missing http mock dir: ${rel(dir)}`);
        continue;
      }
      const files = (await listFiles(dir)).filter((entry) => entry.endsWith('.json'));
      if (files.length === 0) {
        errors.push(`empty http mock dir: ${rel(dir)}`);
      }
    }
  }

  for (const eventType of eventTypes) {
    for (const scenario of scenarios) {
      const dir = path.join(rootDir, 'mock-data', 'events', eventType, scenario);
      if (!(await fileExists(rel(dir)))) {
        errors.push(`missing event mock dir: ${rel(dir)}`);
        continue;
      }
      const files = (await listFiles(dir)).filter((entry) => entry.endsWith('.json'));
      if (files.length === 0) {
        errors.push(`empty event mock dir: ${rel(dir)}`);
      }
    }
  }
}

async function validateSchemasAndFixtures(errors: string[]) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const schemaDir = path.join(rootDir, 'schemas');
  const schemaFiles = (await listFiles(schemaDir)).filter((file) => file.endsWith('.schema.json'));
  const validators = new Map<string, ReturnType<Ajv2020['compile']>>();

  const schemaByRelative = new Map<string, any>();
  for (const schemaFile of schemaFiles) {
    try {
      const schema = await readJson(schemaFile);
      schemaByRelative.set(rel(schemaFile), schema);
      ajv.addSchema(schema, path.basename(schemaFile));
    } catch (error) {
      errors.push(`${rel(schemaFile)}: invalid json schema (${String(error)})`);
    }
  }

  for (const schemaFile of schemaFiles) {
    const key = rel(schemaFile);
    const schema = schemaByRelative.get(key);
    if (!schema) continue;
    try {
      const schemaKey = path.basename(schemaFile);
      const validator = ajv.getSchema(schemaKey);
      if (!validator) {
        throw new Error(`validator missing for ${schemaKey}`);
      }
      validators.set(key, validator);
    } catch (error) {
      errors.push(`${key}: schema compile failed (${String(error)})`);
    }
  }

  const httpMocksDir = path.join(rootDir, 'mock-data', 'http');
  const httpMockFiles = (await listFiles(httpMocksDir)).filter((file) => file.endsWith('.json'));
  for (const mockFile of httpMockFiles) {
    const mockFileName = path.basename(mockFile);
    const schemaFile = path.join(rootDir, 'schemas', 'http', mockFileName.replace(/\.json$/i, '.schema.json'));
    if (!(await fileExists(rel(schemaFile)))) {
      errors.push(`${rel(mockFile)}: missing schema ${rel(schemaFile)}`);
      continue;
    }
    const validate = validators.get(rel(schemaFile));
    if (!validate) {
      errors.push(`${rel(mockFile)}: validator missing for ${rel(schemaFile)}`);
      continue;
    }
    const payload = await readJson(mockFile);
    const ok = validate(payload);
    if (!ok) {
      errors.push(`${rel(mockFile)}: ${ajv.errorsText(validate.errors)}`);
    }
  }

  const eventMocksDir = path.join(rootDir, 'mock-data', 'events');
  const eventMockFiles = (await listFiles(eventMocksDir)).filter((file) => file.endsWith('.json'));
  for (const mockFile of eventMockFiles) {
    const relative = rel(mockFile);
    const parts = relative.split('/');
    const eventType = parts[2];
    const schemaFile = path.join(rootDir, 'schemas', 'events', `${eventType}.schema.json`);
    if (!(await fileExists(rel(schemaFile)))) {
      errors.push(`${relative}: missing schema ${rel(schemaFile)}`);
      continue;
    }
    const validate = validators.get(rel(schemaFile));
    if (!validate) {
      errors.push(`${relative}: validator missing for ${rel(schemaFile)}`);
      continue;
    }
    const payload = await readJson(mockFile);
    const ok = validate(payload);
    if (!ok) {
      errors.push(`${relative}: ${ajv.errorsText(validate.errors)}`);
    }
  }
}

async function main() {
  const errors: string[] = [];

  for (const requiredPath of requiredPaths) {
    if (!(await fileExists(requiredPath))) {
      errors.push(`missing required path: ${requiredPath}`);
    }
  }

  await validateOpenApi(path.join(rootDir, 'openapi', 'ordering.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'drawing.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'nesting.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'aps.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'crm.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'drive.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'foundation-iam.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'foundation-ontology.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'foundation-bom.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'foundation-material.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'foundation-mcp.yaml'), errors);
  await validateOpenApi(path.join(rootDir, 'openapi', 'wms.yaml'), errors);
  await validateAsyncApi(path.join(rootDir, 'asyncapi', 'events.yaml'), errors);
  await validateProfiles(errors);
  await validateMockDataLayout(errors);
  await validateSchemasAndFixtures(errors);
  await validateAppRegistry(errors);

  if (errors.length > 0) {
    console.error('[validate-contracts] failed with errors:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('[validate-contracts] all contracts and fixtures are valid');
}

main().catch((error) => {
  console.error('[validate-contracts] fatal error:', error);
  process.exit(1);
});
