import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

type RawProperty = {
  type?: string;
  required?: boolean;
  description?: string;
  sourceField?: string;
  format?: string;
  enum?: string[];
};

type RawObjectType = {
  name: string;
  description?: string;
  dataDomain: string;
  sourceApp: string;
  sourceService?: string;
  primaryKey: string;
  properties: Record<string, RawProperty | string>;
};

type RawLinkType = {
  name: string;
  from: string;
  to: string;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:N' | string;
  description?: string;
};

type ObjectTypesDoc = {
  objectTypes: RawObjectType[];
};

type LinkTypesDoc = {
  linkTypes: RawLinkType[];
};

const rootDir = path.resolve(process.cwd());
const ontologyDir = path.join(rootDir, 'ontology');
const outFile = path.join(rootDir, 'generated', 'types', 'ontology.ts');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeProperty(input: RawProperty | string): RawProperty {
  if (typeof input === 'string') {
    return { type: input };
  }
  return {
    type: String(input.type ?? 'unknown'),
    ...(input.required !== undefined ? { required: Boolean(input.required) } : {}),
    ...(input.description ? { description: String(input.description) } : {}),
    ...(input.sourceField ? { sourceField: String(input.sourceField) } : {}),
    ...(input.format ? { format: String(input.format) } : {}),
    ...(Array.isArray(input.enum) ? { enum: input.enum.map((item) => String(item)) } : {}),
  };
}

function union(values: string[]): string {
  if (values.length === 0) {
    return 'never';
  }
  return values.map((value) => JSON.stringify(value)).join(' | ');
}

function toConstArray(values: string[]): string {
  return `[
${values.map((value) => `  ${JSON.stringify(value)},`).join('\n')}
] as const`;
}

async function loadYaml<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf8');
  return parseYaml(content) as T;
}

async function main() {
  const objectDoc = await loadYaml<ObjectTypesDoc>(path.join(ontologyDir, 'object-types.yaml'));
  const linkDoc = await loadYaml<LinkTypesDoc>(path.join(ontologyDir, 'link-types.yaml'));

  assert(Array.isArray(objectDoc.objectTypes) && objectDoc.objectTypes.length > 0, 'ontology/object-types.yaml is empty');
  assert(Array.isArray(linkDoc.linkTypes) && linkDoc.linkTypes.length > 0, 'ontology/link-types.yaml is empty');

  const objectTypes = objectDoc.objectTypes;
  const linkTypes = linkDoc.linkTypes;

  const objectTypeNames = objectTypes.map((entry) => String(entry.name));
  const duplicateObjectTypes = objectTypeNames.filter((name, idx) => objectTypeNames.indexOf(name) !== idx);
  assert(duplicateObjectTypes.length === 0, `duplicate object type names: ${duplicateObjectTypes.join(', ')}`);

  for (const entry of objectTypes) {
    assert(entry.name, 'object type missing name');
    assert(entry.dataDomain, `object type ${entry.name} missing dataDomain`);
    assert(entry.sourceApp, `object type ${entry.name} missing sourceApp`);
    assert(entry.primaryKey, `object type ${entry.name} missing primaryKey`);
    assert(entry.properties && typeof entry.properties === 'object', `object type ${entry.name} missing properties`);
  }

  const linkTypeNames = linkTypes.map((entry) => String(entry.name));
  const duplicateLinkTypes = linkTypeNames.filter((name, idx) => linkTypeNames.indexOf(name) !== idx);
  assert(duplicateLinkTypes.length === 0, `duplicate link type names: ${duplicateLinkTypes.join(', ')}`);

  for (const link of linkTypes) {
    assert(objectTypeNames.includes(link.from), `link type ${link.name} references unknown from type: ${link.from}`);
    assert(objectTypeNames.includes(link.to), `link type ${link.name} references unknown to type: ${link.to}`);
    assert(['1:1', '1:N', 'N:1', 'N:N'].includes(link.cardinality), `link type ${link.name} has invalid cardinality: ${link.cardinality}`);
  }

  const dataDomains = Array.from(new Set(objectTypes.map((entry) => String(entry.dataDomain))));
  const appIds = Array.from(new Set(objectTypes.map((entry) => String(entry.sourceApp))));

  const objectTypeDefs = Object.fromEntries(
    objectTypes.map((entry) => {
      const properties = Object.fromEntries(
        Object.entries(entry.properties).map(([key, value]) => [key, normalizeProperty(value)]),
      );

      return [
        entry.name,
        {
          objectType: entry.name,
          description: entry.description ?? '',
          dataDomain: entry.dataDomain,
          sourceApp: entry.sourceApp,
          sourceService: entry.sourceService ?? '',
          primaryKey: entry.primaryKey,
          properties,
        },
      ];
    }),
  );

  const linkTypeDefs = Object.fromEntries(
    linkTypes.map((entry) => [
      entry.name,
      {
        linkType: entry.name,
        fromType: entry.from,
        toType: entry.to,
        cardinality: entry.cardinality,
        description: entry.description ?? '',
      },
    ]),
  );

  const lines: string[] = [];
  lines.push('// Auto-generated by contracts/scripts/generate-ontology-types.ts');
  lines.push('// Do not edit manually.');
  lines.push('');
  lines.push(`export type OntologyDataDomainV1 = ${union(dataDomains)};`);
  lines.push(`export type FoundationAppId = ${union(appIds)};`);
  lines.push(`export type OntologyObjectType = ${union(objectTypeNames)};`);
  lines.push(`export type OntologyLinkType = ${union(linkTypeNames)};`);
  lines.push("export type OntologyCardinality = '1:1' | '1:N' | 'N:1' | 'N:N';");
  lines.push('');
  lines.push('export type OntologyPropertyDefinition = {');
  lines.push('  type: string;');
  lines.push('  required?: boolean;');
  lines.push('  description?: string;');
  lines.push('  sourceField?: string;');
  lines.push('  format?: string;');
  lines.push('  enum?: string[];');
  lines.push('};');
  lines.push('');
  lines.push('export interface OntologyObjectTypeDefinition {');
  lines.push('  objectType: OntologyObjectType;');
  lines.push('  description?: string;');
  lines.push('  dataDomain: OntologyDataDomainV1;');
  lines.push('  sourceApp: FoundationAppId;');
  lines.push('  sourceService?: string;');
  lines.push('  primaryKey: string;');
  lines.push('  properties: Record<string, OntologyPropertyDefinition>;');
  lines.push('}');
  lines.push('');
  lines.push('export interface OntologyLinkTypeDefinition {');
  lines.push('  linkType: OntologyLinkType;');
  lines.push('  fromType: OntologyObjectType;');
  lines.push('  toType: OntologyObjectType;');
  lines.push('  cardinality: OntologyCardinality;');
  lines.push('  description: string;');
  lines.push('}');
  lines.push('');
  lines.push('export interface SearchQuery {');
  lines.push('  text?: string;');
  lines.push('  filters?: Record<string, unknown>;');
  lines.push('  limit?: number;');
  lines.push('  offset?: number;');
  lines.push('}');
  lines.push('');
  lines.push('export interface OntologyObject<T extends OntologyObjectType = OntologyObjectType> {');
  lines.push('  objectType: T;');
  lines.push('  primaryKey: string;');
  lines.push('  properties: Record<string, unknown>;');
  lines.push('  sourceApp: FoundationAppId;');
  lines.push('  dataDomain: OntologyDataDomainV1;');
  lines.push('  syncedAt: string;');
  lines.push('}');
  lines.push('');
  lines.push('export interface OntologyLink {');
  lines.push('  linkType: OntologyLinkType;');
  lines.push('  fromType: OntologyObjectType;');
  lines.push('  fromKey: string;');
  lines.push('  toType: OntologyObjectType;');
  lines.push('  toKey: string;');
  lines.push('  properties?: Record<string, unknown>;');
  lines.push('  syncedAt?: string;');
  lines.push('}');
  lines.push('');
  lines.push('export interface IObjectResolver {');
  lines.push('  objectTypes: OntologyObjectType[];');
  lines.push('  resolve(type: OntologyObjectType, keys: string[]): Promise<OntologyObject[]>;');
  lines.push('  search(type: OntologyObjectType, query: SearchQuery): Promise<OntologyObject[]>;');
  lines.push('  resolveLinks(type: OntologyLinkType, fromKeys: string[]): Promise<OntologyLink[]>;');
  lines.push('}');
  lines.push('');
  lines.push('export interface IVendorAdapter {');
  lines.push('  vendorId: string;');
  lines.push('  supportedTypes: OntologyObjectType[];');
  lines.push('  mapToOntology(vendorData: unknown, targetType: OntologyObjectType): OntologyObject;');
  lines.push('  mapFromOntology(object: OntologyObject): unknown;');
  lines.push('}');
  lines.push('');
  lines.push(`export const ONTOLOGY_DATA_DOMAINS = ${toConstArray(dataDomains)};`);
  lines.push(`export const ONTOLOGY_OBJECT_TYPES = ${toConstArray(objectTypeNames)};`);
  lines.push(`export const ONTOLOGY_LINK_TYPES = ${toConstArray(linkTypeNames)};`);
  lines.push('');
  lines.push('export const ONTOLOGY_OBJECT_TYPE_DEFS = ');
  lines.push(`${JSON.stringify(objectTypeDefs, null, 2)} as const satisfies Record<OntologyObjectType, OntologyObjectTypeDefinition>;`);
  lines.push('');
  lines.push('export const ONTOLOGY_LINK_TYPE_DEFS = ');
  lines.push(`${JSON.stringify(linkTypeDefs, null, 2)} as const satisfies Record<OntologyLinkType, OntologyLinkTypeDefinition>;`);
  lines.push('');

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, `${lines.join('\n')}\n`, 'utf8');
  console.log('[generate-ontology-types] generated generated/types/ontology.ts');
}

main().catch((error) => {
  console.error('[generate-ontology-types] failed:', error);
  process.exit(1);
});
