import { promises as fs } from 'node:fs';
import path from 'node:path';

async function resolvePatternFile(name: string) {
  const candidates = [
    path.join(process.cwd(), 'app/(app)/create/patterns', name),
    path.join(process.cwd(), 'packages/web/app/(app)/create/patterns', name),
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
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
