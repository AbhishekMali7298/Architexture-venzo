import type { MaterialAssetRef, MaterialSource } from '@textura/shared';
import { getAssetUrl } from './material-assets';

export interface JointMaterialLibraryItem {
  id: string;
  name: string;
  thumbnailPath: string;
  renderPath: string;
  mimeType: string;
}

export function getJointMaterialName(source: MaterialSource): string {
  if (source.type === 'solid') {
    return 'Solid Fill';
  }

  if ((source.type === 'image' || source.type === 'generated') && source.asset?.path) {
    const segments = source.asset.path.split('/');
    const folderName = segments.at(-2) ?? segments.at(-1) ?? 'Joint Material';
    return folderName
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return 'Joint Material';
}

export function getJointMaterialPreviewUrl(source: MaterialSource): string | null {
  if ((source.type === 'image' || source.type === 'generated') && source.asset) {
    return getAssetUrl(source.asset);
  }
  return null;
}

export function buildJointMaterialAsset(item: JointMaterialLibraryItem): MaterialAssetRef {
  return {
    path: item.renderPath,
    mimeType: item.mimeType,
  };
}
