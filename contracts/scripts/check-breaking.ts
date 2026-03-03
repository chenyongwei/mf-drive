import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const rootDir = path.resolve(process.cwd());
const baselinePath = path.join(rootDir, 'scripts', '.baseline', 'signature.json');

interface Signature {
  openapi: Record<string, string[]>;
  asyncapi: string[];
  schemaRequired: Record<string, string[]>;
}

function rel(filePath: string): string {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
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

async function buildSignature(): Promise<Signature> {
  const signature: Signature = {
    openapi: {},
    asyncapi: [],
    schemaRequired: {},
  };

  const openapiFiles = [
    'ordering.yaml',
    'drawing.yaml',
    'nesting.yaml',
    'aps.yaml',
    'crm.yaml',
    'drive.yaml',
    'foundation-iam.yaml',
    'foundation-ontology.yaml',
    'foundation-bom.yaml',
    'foundation-material.yaml',
    'foundation-mcp.yaml',
    'wms.yaml',
  ];
  for (const fileName of openapiFiles) {
    const full = path.join(rootDir, 'openapi', fileName);
    const parsed = parseYaml(await fs.readFile(full, 'utf8')) as any;
    const operations: string[] = [];
    const paths = parsed?.paths ?? {};
    for (const [route, methods] of Object.entries<any>(paths)) {
      for (const [method, operation] of Object.entries<any>(methods ?? {})) {
        const operationId = operation?.operationId ? `:${operation.operationId}` : '';
        operations.push(`${String(method).toUpperCase()} ${route}${operationId}`);
      }
    }
    signature.openapi[fileName] = operations.sort();
  }

  const asyncApi = parseYaml(await fs.readFile(path.join(rootDir, 'asyncapi', 'events.yaml'), 'utf8')) as any;
  signature.asyncapi = Object.keys(asyncApi?.channels ?? {}).sort();

  const schemaFiles = (await listFiles(path.join(rootDir, 'schemas'))).filter((file) => file.endsWith('.schema.json'));
  for (const schemaFile of schemaFiles) {
    const schema = JSON.parse(await fs.readFile(schemaFile, 'utf8')) as any;
    const required = Array.isArray(schema.required) ? [...schema.required].sort() : [];
    signature.schemaRequired[rel(schemaFile)] = required;
  }

  return signature;
}

function diffRemovals(before: string[], after: string[]): string[] {
  const afterSet = new Set(after);
  return before.filter((entry) => !afterSet.has(entry));
}

async function main() {
  const shouldUpdate = process.argv.includes('--update') || process.env.UPDATE_BASELINE === 'true';
  const current = await buildSignature();

  if (shouldUpdate) {
    await fs.mkdir(path.dirname(baselinePath), { recursive: true });
    await fs.writeFile(baselinePath, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    console.log('[check-breaking] baseline updated');
    return;
  }

  let baselineRaw: string;
  try {
    baselineRaw = await fs.readFile(baselinePath, 'utf8');
  } catch {
    console.error('[check-breaking] baseline missing. Run: npm run baseline:update');
    process.exit(1);
  }

  const baseline = JSON.parse(baselineRaw) as Signature;
  const errors: string[] = [];

  for (const [fileName, oldOps] of Object.entries(baseline.openapi)) {
    const newOps = current.openapi[fileName] ?? [];
    const removedOps = diffRemovals(oldOps, newOps);
    for (const operation of removedOps) {
      errors.push(`removed OpenAPI operation: ${fileName} -> ${operation}`);
    }
  }

  const removedChannels = diffRemovals(baseline.asyncapi, current.asyncapi);
  for (const channel of removedChannels) {
    errors.push(`removed AsyncAPI channel: ${channel}`);
  }

  for (const [schemaName, oldRequired] of Object.entries(baseline.schemaRequired)) {
    const newRequired = current.schemaRequired[schemaName] ?? [];
    const removedRequired = diffRemovals(oldRequired, newRequired);
    for (const requiredField of removedRequired) {
      errors.push(`removed required field: ${schemaName} -> ${requiredField}`);
    }
  }

  if (errors.length > 0) {
    console.error('[check-breaking] breaking changes detected:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('[check-breaking] no breaking removals detected');
}

main().catch((error) => {
  console.error('[check-breaking] fatal error:', error);
  process.exit(1);
});
