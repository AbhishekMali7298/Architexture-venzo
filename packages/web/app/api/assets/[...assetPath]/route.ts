import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const ASSET_ROOT = path.resolve(process.cwd(), '../../assets');

function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetPath: string[] }> },
) {
  const { assetPath } = await context.params;
  const resolvedAssetPath = path.resolve(ASSET_ROOT, ...assetPath);

  if (!resolvedAssetPath.startsWith(ASSET_ROOT)) {
    return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 });
  }

  try {
    const file = await fs.readFile(resolvedAssetPath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': getContentType(resolvedAssetPath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
