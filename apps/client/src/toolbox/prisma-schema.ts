// Just enough of a Prisma schema parser to draw the data model: models, fields, relations, enums.

export type Field = {
  name: string;
  type: string;
  list: boolean;
  optional: boolean;
  id: boolean;
  unique: boolean;
  /** The `///` comment above the field. */
  doc: string | null;
  /** For a relation field: the foreign key fields here and the fields they reference. */
  relation: { fields: string[]; references: string[] } | null;
};

export type Model = { name: string; table: string; doc: string | null; fields: Field[] };
export type Enum = { name: string; values: string[] };

export function parsePrismaSchema(source: string): { models: Model[]; enums: Enum[] } {
  const models: Model[] = [];
  const enums: Enum[] = [];
  const blocks = source.matchAll(/((?:^\/\/\/.*\n)*)^(model|enum)\s+(\w+)\s*\{([\s\S]*?)^\}/gm);
  for (const [, docLines, kind, name, body] of blocks) {
    const lines = parseLines(body);
    if (kind === 'enum') {
      enums.push({ name, values: lines.map(({ line }) => line.split(/\s+/)[0]) });
    } else {
      const table = /@@map\("([^"]+)"\)/.exec(body)?.[1] ?? name;
      const fields = lines.map(({ line, doc }) => parseField(line, doc));
      models.push({ name, table, doc: toDoc(docLines), fields });
    }
  }
  return { models, enums };
}

/** The field lines of a block, each with the `///` comment above it. */
function parseLines(body: string): { line: string; doc: string | null }[] {
  const lines: { line: string; doc: string | null }[] = [];
  let doc = '';
  for (const raw of body.split('\n').map((line) => line.trim())) {
    if (raw.startsWith('///')) doc += `${raw}\n`;
    else {
      const line = raw.replace(/\/\/.*$/, '').trim();
      if (line && !line.startsWith('@@')) lines.push({ line, doc: toDoc(doc) });
      doc = '';
    }
  }
  return lines;
}

function toDoc(lines: string): string | null {
  return lines.replace(/^\/\/\/\s?/gm, '').trim() || null;
}

function parseField(line: string, doc: string | null): Field {
  const [name, rawType = '', ...rest] = line.split(/\s+/);
  const attributes = rest.join(' ');
  const list = (key: string) =>
    new RegExp(`@relation\\([^)]*${key}:\\s*\\[([^\\]]*)\\]`)
      .exec(attributes)?.[1]
      .split(',')
      .map((field) => field.trim());
  const fields = list('fields');
  const references = list('references');
  return {
    name,
    type: rawType.replace(/[?[\]]/g, ''),
    list: rawType.endsWith('[]'),
    optional: rawType.endsWith('?'),
    id: /@id\b/.test(attributes),
    unique: /@unique\b/.test(attributes),
    doc,
    relation: fields && references ? { fields, references } : null,
  };
}
