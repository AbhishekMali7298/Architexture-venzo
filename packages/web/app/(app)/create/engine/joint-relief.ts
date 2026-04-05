import type { TextureConfig } from '@textura/shared';
import { type PatternTile } from './pattern-layouts';
import { getTileRenderBox } from './render-geometry';
import type { EdgeProfileData } from '../lib/edge-style-assets';

interface JointReliefOptions {
  ctx: CanvasRenderingContext2D;
  config: TextureConfig;
  tiles: PatternTile[];
  repeatWidth: number;
  repeatHeight: number;
  scale: number;
  drawOffsetX: number;
  drawOffsetY: number;
  edgeProfiles?: EdgeProfileData[] | null;
}

function withTileTransform(
  ctx: CanvasRenderingContext2D,
  tile: PatternTile,
  scale: number,
  drawOffsetX: number,
  drawOffsetY: number,
  callback: () => void,
) {
  ctx.save();
  ctx.translate(drawOffsetX + tile.x * scale, drawOffsetY + tile.y * scale);
  if (tile.rotation !== 0) {
    ctx.translate((tile.width * scale) / 2, (tile.height * scale) / 2);
    ctx.rotate((tile.rotation * Math.PI) / 180);
    ctx.translate(-(tile.width * scale) / 2, -(tile.height * scale) / 2);
  }
  callback();
  ctx.restore();
}

function appendPolygonPath(
  path: Path2D,
  points: ReadonlyArray<{ x: number; y: number }>,
) {
  if (!points.length) return;
  path.moveTo(points[0]!.x, points[0]!.y);
  for (let index = 1; index < points.length; index++) {
    const point = points[index]!;
    path.lineTo(point.x, point.y);
  }
  path.closePath();
}

function appendRoundedRectPath(
  path: Path2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  path.moveTo(x + radius, y);
  path.arcTo(x + width, y, x + width, y + height, radius);
  path.arcTo(x + width, y + height, x, y + height, radius);
  path.arcTo(x, y + height, x, y, radius);
  path.arcTo(x, y, x + width, y, radius);
  path.closePath();
}

function buildTilePath(
  tile: PatternTile,
  config: TextureConfig,
  scale: number,
  edgeProfiles?: EdgeProfileData[] | null,
) {
  const { tileX, tileY, tileWidth, tileHeight, cornerRadius, clipPath } = getTileRenderBox(tile, config, scale, {
    edgeProfiles,
  });
  const path = new Path2D();

  if (clipPath?.length) {
    appendPolygonPath(path, clipPath);
    return path;
  }

  if (cornerRadius > 0) {
    appendRoundedRectPath(path, tileX, tileY, tileWidth, tileHeight, cornerRadius);
    return path;
  }

  path.rect(tileX, tileY, tileWidth, tileHeight);
  path.closePath();
  return path;
}

export function renderJointRelief({
  ctx,
  config,
  tiles,
  repeatWidth,
  repeatHeight,
  scale,
  drawOffsetX,
  drawOffsetY,
  edgeProfiles,
}: JointReliefOptions) {
  if (!config.joints.recessJoints && !config.joints.concaveJoints) return;

  const averageJointWidth = Math.max(1, ((config.joints.horizontalSize + config.joints.verticalSize) / 2) * scale);
  const tilePaths = tiles.map((tile) => ({
    tile,
    path: buildTilePath(tile, config, scale, edgeProfiles),
  }));
  const jointClip = new Path2D();
  jointClip.rect(0, 0, repeatWidth * scale, repeatHeight * scale);
  for (const { tile, path } of tilePaths) {
    withTileTransform(ctx, tile, scale, drawOffsetX, drawOffsetY, () => {
      jointClip.addPath(path, ctx.getTransform());
    });
  }

  ctx.save();
  ctx.clip(jointClip, 'evenodd');

  if (config.joints.recessJoints) {
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, 0, repeatWidth * scale, repeatHeight * scale);

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = averageJointWidth * 0.95;
    for (const { tile, path } of tilePaths) {
      withTileTransform(ctx, tile, scale, drawOffsetX, drawOffsetY, () => {
        ctx.stroke(path);
      });
    }
    ctx.restore();
  }

  if (config.joints.concaveJoints) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = averageJointWidth * 1.35;
    for (const { tile, path } of tilePaths) {
      withTileTransform(ctx, tile, scale, drawOffsetX, drawOffsetY, () => {
        ctx.stroke(path);
      });
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = Math.max(1, averageJointWidth * 0.3);
    for (const { tile, path } of tilePaths) {
      withTileTransform(ctx, tile, scale, drawOffsetX, drawOffsetY, () => {
        ctx.stroke(path);
      });
    }
    ctx.restore();
  }

  ctx.restore();
}
