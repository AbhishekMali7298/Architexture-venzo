import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const safeName = path.basename(name);
  const filePath = path.join(process.cwd(), 'packages/web/app/(app)/create/patterns', safeName);

  try {
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
