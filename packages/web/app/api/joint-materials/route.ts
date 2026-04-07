import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const JOINTS_ROOT_CANDIDATES = [
  path.resolve(process.cwd(), 'public/Joints-Patterns'),
  path.resolve(process.cwd(), 'packages/web/public/Joints-Patterns'),
  path.resolve(process.cwd(), '../../assets/joints'),
];

function isImageFile(fileName: string) {
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(fileName).toLowerCase());
}

function getContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function titleize(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeJointBaseName(fileName: string) {
  return path
    .parse(fileName)
    .name
    .replace(/[-_](thumb|thumbnail|preview|main|albedo|original|texture)$/i, '')
    .toLowerCase();
}

function pickPreferredFile(files: string[], preferredBaseNames: string[]) {
  for (const preferredBaseName of preferredBaseNames) {
    const match = files.find((file) => path.parse(file).name.toLowerCase() === preferredBaseName);
    if (match) return match;
  }
  return null;
}

export async function GET() {
  try {
    const jointsRoot = await resolveJointsRoot();
    if (!jointsRoot) {
      return NextResponse.json([]);
    }

    const entries = await fs.readdir(jointsRoot, { withFileTypes: true });
    const materials = [];
    const rootFiles = entries.filter((entry) => entry.isFile() && isImageFile(entry.name)).map((entry) => entry.name);

    const groupedRootFiles = new Map<string, string[]>();
    for (const file of rootFiles) {
      const baseName = normalizeJointBaseName(file);
      const existing = groupedRootFiles.get(baseName) ?? [];
      existing.push(file);
      groupedRootFiles.set(baseName, existing);
    }

    for (const [baseName, files] of groupedRootFiles.entries()) {
      const thumbnailFile =
        pickPreferredFile(files, [`${baseName}-thumb`, `${baseName}-thumbnail`, `${baseName}-preview`]) ??
        pickPreferredFile(files, [`${baseName}-main`, `${baseName}-albedo`, `${baseName}-original`, `${baseName}-texture`]) ??
        files[0]!;

      const renderFile =
        pickPreferredFile(files, [`${baseName}-main`, `${baseName}-albedo`, `${baseName}-original`, `${baseName}-texture`]) ??
        thumbnailFile;

      materials.push({
        id: baseName,
        name: titleize(baseName),
        thumbnailPath: toPublicAssetPath(jointsRoot, thumbnailFile),
        renderPath: toPublicAssetPath(jointsRoot, renderFile),
        mimeType: getContentType(renderFile),
      });
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const folderPath = path.join(jointsRoot, entry.name);
      const files = (await fs.readdir(folderPath)).filter(isImageFile);
      if (!files.length) continue;

      const thumbnailFile =
        pickPreferredFile(files, ['thumb', 'thumbnail', 'preview']) ??
        pickPreferredFile(files, ['main', 'albedo', 'original', 'texture']) ??
        files[0]!;

      const renderFile =
        pickPreferredFile(files, ['main', 'albedo', 'original', 'texture']) ??
        thumbnailFile;

      materials.push({
        id: entry.name,
        name: titleize(entry.name),
        thumbnailPath: toPublicAssetPath(jointsRoot, path.join(entry.name, thumbnailFile)),
        renderPath: toPublicAssetPath(jointsRoot, path.join(entry.name, renderFile)),
        mimeType: getContentType(renderFile),
      });
    }

    return NextResponse.json(materials);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json([]);
    }

    return NextResponse.json({ error: 'Failed to load joint materials' }, { status: 500 });
  }
}

async function resolveJointsRoot() {
  for (const candidate of JOINTS_ROOT_CANDIDATES) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function toPublicAssetPath(rootPath: string, relativeFilePath: string) {
  const normalizedRoot = rootPath.split(path.sep).join('/');
  const normalizedRelative = relativeFilePath.split(path.sep).join('/');

  if (normalizedRoot.endsWith('/public/Joints-Patterns')) {
    return `/Joints-Patterns/${normalizedRelative}`;
  }

  return `joints/${normalizedRelative}`;
}
