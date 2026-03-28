import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const ASSET_ROOT = path.resolve(process.cwd(), '../../assets');
const CREATE_PATTERN_ROOT = path.resolve(process.cwd(), 'app/(app)/create/patterns');

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
  const requestedRelativePath = assetPath.join('/');
  const resolvedAssetPath = path.resolve(ASSET_ROOT, ...assetPath);
  const resolvedCreatePatternPath = path.resolve(CREATE_PATTERN_ROOT, ...assetPath.slice(1));

  if (!resolvedAssetPath.startsWith(ASSET_ROOT)) {
    return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 });
  }

  try {
    let filePath = resolvedAssetPath;

    if (
      requestedRelativePath.startsWith('patterns/') &&
      resolvedCreatePatternPath.startsWith(CREATE_PATTERN_ROOT)
    ) {
      try {
        await fs.access(resolvedCreatePatternPath);
        filePath = resolvedCreatePatternPath;
      } catch {
        filePath = resolvedAssetPath;
      }
    }

    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': getContentType(filePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
