import fs from 'node:fs/promises';
import path from 'node:path';

import listEndpoints from 'express-list-endpoints';
import { createGenerator } from 'ts-json-schema-generator';

import { app } from '../server';
import { getRegisteredOperation, listRegisteredSchemaTypeNames } from '../server/openapi/registry';

type Endpoint = { path: string; methods: string[] };

type RequestBodySpec = {
  required?: boolean;
  content: Record<string, { schema: Record<string, unknown> }>;
};

function toOpenApiPath(expressPath: string): { path: string; params: string[] } {
  const params: string[] = [];
  const out = expressPath.replace(/:([A-Za-z0-9_]+)/g, (_m, p1: string) => {
    params.push(p1);
    return `{${p1}}`;
  });
  return { path: out, params };
}

function toOperationId(method: string, openapiPath: string): string {
  const cleaned = openapiPath
    .replace(/\{([^}]+)\}/g, 'By_$1')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return `${method.toLowerCase()}_${cleaned || 'root'}`;
}

function sortPaths(a: string, b: string) {
  return a.localeCompare(b);
}

function schemaRef(typeName: string): Record<string, unknown> {
  return { $ref: `#/components/schemas/${typeName}` };
}

function generateSchemasFromTypescript(): Record<string, unknown> {
  const root = process.cwd();
  const typeFile = path.join(root, 'server', 'openapi', 'types.ts');
  const tsconfig = path.join(root, 'tsconfig.server.json');

  const generator = createGenerator({
    path: typeFile,
    tsconfig,
    expose: 'export',
    topRef: false,
    skipTypeCheck: true,
  });

  const typeNames = listRegisteredSchemaTypeNames();

  const schemas: Record<string, unknown> = {};

  const addDefinition = (key: string, value: unknown) => {
    const k = String(key || '').trim();
    if (!k) return;
    if (schemas[k]) return;
    schemas[k] = value as any;
  };

  const rewriteRefsInPlace = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) rewriteRefsInPlace(item);
      return;
    }

    const rec = node as Record<string, unknown>;
    for (const [k, v] of Object.entries(rec)) {
      if (k === '$ref' && typeof v === 'string') {
        if (v.startsWith('#/definitions/')) {
          rec[k] = `#/components/schemas/${v.slice('#/definitions/'.length)}`;
        } else if (v.startsWith('#/$defs/')) {
          rec[k] = `#/components/schemas/${v.slice('#/$defs/'.length)}`;
        }
      } else {
        rewriteRefsInPlace(v);
      }
    }
  };

  for (const name of typeNames) {
    const schemaDoc = generator.createSchema(name) as Record<string, unknown>;

    const defs = ((schemaDoc as any).definitions || (schemaDoc as any).$defs) as Record<string, unknown> | undefined;
    if (defs && typeof defs === 'object') {
      for (const [defName, defSchema] of Object.entries(defs)) {
        addDefinition(defName, defSchema);
      }
    }

    // Sometimes the root schema is itself the named schema (without definitions).
    // Keep it under the requested name if we don't already have it.
    if (!schemas[name]) {
      const { $schema, definitions, $defs, ...rest } = schemaDoc as any;
      addDefinition(name, rest);
    }
  }

  // OpenAPI tooling expects refs under components/schemas, not JSON-Schema definitions/$defs.
  for (const v of Object.values(schemas)) rewriteRefsInPlace(v);

  return schemas;
}

async function main() {
  const derivedSchemas = generateSchemasFromTypescript();

  const endpoints = (listEndpoints(app) as unknown as Endpoint[])
    .filter((e) => typeof e?.path === 'string' && Array.isArray(e?.methods))
    .filter((e) => e.path.startsWith('/api/'))
    .map((e) => ({ path: e.path, methods: e.methods.map((m) => String(m).toUpperCase()) }));

  const paths: Record<string, Record<string, unknown>> = {};

  for (const e of endpoints) {
    const { path: openapiPath, params } = toOpenApiPath(e.path);
    if (!paths[openapiPath]) paths[openapiPath] = {};

    for (const m of e.methods) {
      const method = m.toLowerCase();
      if (method === 'head' || method === 'options') continue;

      const parameters = params.map((name) => ({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' },
      }));

      const reg = getRegisteredOperation(method, openapiPath);

      const queryParams = reg?.query && typeof reg.query === 'object'
        ? Object.entries(reg.query).map(([name, spec]) => ({
            name,
            in: 'query',
            required: Boolean(spec?.required),
            ...(spec?.description ? { description: String(spec.description) } : {}),
            schema: spec?.schema || { type: 'string' },
          }))
        : [];

      const mergedParameters = [...parameters, ...queryParams];

      const requestBody: RequestBodySpec | null = (() => {
        if (method === 'get' || method === 'head' || method === 'options') return null;
        const rb = reg?.requestBody;
        if (!rb) {
          return {
            required: true,
            content: {
              'application/json': { schema: { type: 'object', additionalProperties: true } },
            },
          };
        }

        const contentType = rb.contentType;
        const schema = rb.schema?.typeName ? schemaRef(rb.schema.typeName) : { type: 'object', additionalProperties: true };

        return {
          required: rb.required ?? true,
          content: {
            [contentType]: { schema: schema as any },
          },
        };
      })();

      const responseContentType = reg?.response?.contentType || 'application/json';
      const responseSchema = reg?.response?.schema?.typeName
        ? schemaRef(reg.response.schema.typeName)
        : { type: 'object', additionalProperties: true };

      paths[openapiPath][method] = {
        operationId: toOperationId(method, openapiPath),
        ...(mergedParameters.length ? { parameters: mergedParameters } : {}),
        ...(reg?.summary ? { summary: reg.summary } : {}),
        ...(reg?.requiresBearerAuth ? { security: [{ BearerAuth: [] }] } : {}),
        ...(requestBody ? { requestBody } : {}),
        responses: {
          '200': {
            description: 'OK',
            content: {
              [responseContentType]: {
                schema:
                  responseContentType === 'application/octet-stream' || responseContentType === 'application/zip'
                    ? { type: 'string', format: 'binary' }
                    : (responseSchema as any),
              },
            },
          },
        },
      };
    }
  }

  const sortedPaths: Record<string, Record<string, unknown>> = {};
  for (const key of Object.keys(paths).sort(sortPaths)) {
    const methods = paths[key];
    const methodKeys = Object.keys(methods).sort(sortPaths);
    const sortedMethods: Record<string, unknown> = {};
    for (const mk of methodKeys) sortedMethods[mk] = methods[mk];
    sortedPaths[key] = sortedMethods;
  }

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Generator API',
      version: '0.1.0',
    },
    paths: sortedPaths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: derivedSchemas,
    },
  };

  const outPath = path.join(process.cwd(), 'server', 'openapi.json');
  await fs.writeFile(outPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote OpenAPI: ${outPath} (${Object.keys(sortedPaths).length} paths)`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
