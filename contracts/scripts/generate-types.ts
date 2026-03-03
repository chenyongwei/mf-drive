import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve(process.cwd());
const schemasDir = path.join(rootDir, 'schemas');
const outDir = path.join(rootDir, 'generated', 'types');

function toPascalCase(input: string): string {
  return input
    .replace(/\.schema\.json$/i, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

type TypeRenderContext = {
  currentFile: string;
  currentRoot: unknown;
  cache: Map<string, unknown>;
  seenRefs: Set<string>;
};

async function loadSchemaFile(filePath: string, cache: Map<string, unknown>): Promise<unknown> {
  const normalizedPath = path.resolve(filePath);
  if (cache.has(normalizedPath)) {
    return cache.get(normalizedPath);
  }
  const raw = await fs.readFile(normalizedPath, 'utf8');
  const parsed = JSON.parse(raw);
  cache.set(normalizedPath, parsed);
  return parsed;
}

function resolveJsonPointer(root: unknown, pointer: string): unknown {
  if (!pointer || pointer === '/') {
    return root;
  }
  if (!pointer.startsWith('/')) {
    return undefined;
  }
  const tokens = pointer
    .split('/')
    .slice(1)
    .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));

  let cursor: unknown = root;
  for (const token of tokens) {
    if (!cursor || typeof cursor !== 'object') {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[token];
  }
  return cursor;
}

async function resolveRefSchema(ref: string, context: TypeRenderContext): Promise<{ schema: unknown; nextContext: TypeRenderContext } | null> {
  const [refPathPart, refPointerPart = ''] = ref.split('#');
  const refPath = refPathPart.trim();
  const pointer = refPointerPart.trim();

  let targetFilePath = context.currentFile;
  let targetRoot = context.currentRoot;

  if (refPath.length > 0) {
    targetFilePath = path.resolve(path.dirname(context.currentFile), refPath);
    targetRoot = await loadSchemaFile(targetFilePath, context.cache);
  }

  const resolvedPointer = pointer ? `/${pointer.replace(/^\//, '')}` : '';
  const targetSchema = resolvedPointer ? resolveJsonPointer(targetRoot, resolvedPointer) : targetRoot;
  if (!targetSchema || typeof targetSchema !== 'object') {
    return null;
  }

  const refKey = `${targetFilePath}#${resolvedPointer}`;
  if (context.seenRefs.has(refKey)) {
    return null;
  }

  return {
    schema: targetSchema,
    nextContext: {
      currentFile: targetFilePath,
      currentRoot: targetRoot,
      cache: context.cache,
      seenRefs: new Set([...context.seenRefs, refKey]),
    },
  };
}

async function tsTypeFromSchema(schema: any, context: TypeRenderContext): Promise<string> {
  if (!schema || typeof schema !== 'object') return 'unknown';

  if (schema.$ref) {
    const ref = String(schema.$ref);
    const hasPointer = ref.includes('#') && ref.split('#')[1].length > 0;
    if (!hasPointer) {
      const refName = path.basename(ref).split('/').pop() ?? 'Unknown';
      return toPascalCase(refName);
    }

    const resolved = await resolveRefSchema(ref, context);
    if (!resolved) {
      return 'unknown';
    }
    return tsTypeFromSchema(resolved.schema, resolved.nextContext);
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    const types = await Promise.all(schema.allOf.map((child: any) => tsTypeFromSchema(child, context)));
    return types.join(' & ');
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    const types = await Promise.all(schema.oneOf.map((child: any) => tsTypeFromSchema(child, context)));
    return types.join(' | ');
  }

  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    const types = await Promise.all(schema.anyOf.map((child: any) => tsTypeFromSchema(child, context)));
    return types.join(' | ');
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum.map((value: unknown) => JSON.stringify(value)).join(' | ');
  }

  if (Array.isArray(schema.type)) {
    const types = await Promise.all(schema.type.map((entry: string) => tsTypeFromSchema({ ...schema, type: entry }, context)));
    return types.join(' | ');
  }

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array': {
      const itemType = await tsTypeFromSchema(schema.items ?? {}, context);
      return `${itemType}[]`;
    }
    case 'object': {
      const requiredSet = new Set<string>(Array.isArray(schema.required) ? schema.required : []);
      const properties = schema.properties ?? {};
      const entries = await Promise.all(Object.entries(properties).map(async ([name, propSchema]) => {
        const optional = requiredSet.has(name) ? '' : '?';
        return `${JSON.stringify(name)}${optional}: ${await tsTypeFromSchema(propSchema, context)};`;
      }));
      if (entries.length === 0) return 'Record<string, unknown>';
      return `{ ${entries.join(' ')} }`;
    }
    default:
      return 'unknown';
  }
}

async function listSchemaFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSchemaFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.schema.json')) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

async function generateFile(section: 'http' | 'events'): Promise<void> {
  const schemaDir = path.join(schemasDir, section);
  const schemaFiles = await listSchemaFiles(schemaDir);
  const cache = new Map<string, unknown>();

  const lines: string[] = [];
  lines.push('// Auto-generated by contracts/scripts/generate-types.ts');
  lines.push('// Do not edit manually.');
  lines.push('');

  for (const schemaFile of schemaFiles) {
    const schema = await loadSchemaFile(schemaFile, cache);
    const fileName = path.basename(schemaFile);
    const typeName = toPascalCase(fileName);
    const renderedType = await tsTypeFromSchema(schema, {
      currentFile: path.resolve(schemaFile),
      currentRoot: schema,
      cache,
      seenRefs: new Set<string>(),
    });
    lines.push(`export type ${typeName} = ${renderedType};`);
    lines.push('');
  }

  const outPath = path.join(outDir, `${section}.ts`);
  await fs.writeFile(outPath, lines.join('\n'));
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await generateFile('http');
  await generateFile('events');
  await fs.writeFile(
    path.join(outDir, 'index.ts'),
    "export * from './http';\nexport * from './events';\nexport * from './ontology';\nexport * from './app-registry';\nexport * from './resource-packs';\n",
    'utf8',
  );
  console.log('[generate-types] generated files in generated/types');
}

main().catch((error) => {
  console.error('[generate-types] failed:', error);
  process.exit(1);
});
