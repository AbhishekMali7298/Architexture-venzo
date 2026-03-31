import { promises as fs } from 'node:fs';
import path from 'node:path';

const FILENAME_ALIASES: Record<string, string[]> = {
  'running_bond.svg': ['common.svg'],
  'stack_bond.svg': ['stack.svg'],
  'stretcher_bond.svg': ['stretcher.svg'],
  'flemish_bond.svg': ['flemish.svg'],
  'intersecting_circle.svg': ['circular.svg'],
};

async function resolvePatternFile(name: string) {
  const candidateNames = [name, ...(FILENAME_ALIASES[name] ?? [])];
  const candidates = [
    ...candidateNames.map((candidateName) => path.join(process.cwd(), 'public/patterns', candidateName)),
    ...candidateNames.map((candidateName) => path.join(process.cwd(), 'packages/web/public/patterns', candidateName)),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const safeName = path.basename(name);
  const filePath = await resolvePatternFile(safeName);

  try {
    if (!filePath) {
      return new Response('Not found', { status: 404 });
    }

    const content = await fs.readFile(filePath, 'utf8');
    return new Response(content, {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
