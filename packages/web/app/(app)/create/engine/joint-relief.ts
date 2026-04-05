import type { TextureConfig } from '@textura/shared';
import { tracePolygonPath, traceRoundedRectPath } from './material-fill';
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

function traceTilePath(
  ctx: CanvasRenderingContext2D,
  tile: PatternTile,
  config: TextureConfig,
  scale: number,
  edgeProfiles?: EdgeProfileData[] | null,
) {
  const { tileX, tileY, tileWidth, tileHeight, cornerRadius, clipPath } = getTileRenderBox(tile, config, scale, {
    edgeProfiles,
  });

  if (clipPath?.length) {
    tracePolygonPath(ctx, clipPath);
    return;
  }

  if (cornerRadius > 0) {
    traceRoundedRectPath(ctx, tileX, tileY, tileWidth, tileHeight, cornerRadius);
    return;
  }

  ctx.beginPath();
  ctx.rect(tileX, tileY, tileWidth, tileHeight);
  ctx.closePath();
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

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, repeatWidth * scale, repeatHeight * scale);
  for (const tile of tiles) {
    withTileTransform(ctx, tile, scale, drawOffsetX, drawOffsetY, () => {
      traceTilePath(ctx, tile, config, scale, edgeProfiles);
    });
  }
  ctx.clip('evenodd');

  if (config.joints.recessJoints) {
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, 0, repeatWidth * scale, repeatHeight * scale);

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = averageJointWidth * 0.95;
    for (const tile of tiles) {
      withTileTransform(ctx, tile, scale, drawOffsetX, drawOffsetY, () => {
        traceTilePath(ctx, tile, config, scale, edgeProfiles);
        ctx.stroke();
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
    for (const tile of tiles) {
      withTileTransform(ctx, tile, scale, drawOffsetX, drawOffsetY, () => {
        traceTilePath(ctx, tile, config, scale, edgeProfiles);
        ctx.stroke();
      });
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = Math.max(1, averageJointWidth * 0.3);
    for (const tile of tiles) {
      withTileTransform(ctx, tile, scale, drawOffsetX, drawOffsetY, () => {
        traceTilePath(ctx, tile, config, scale, edgeProfiles);
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  ctx.restore();
}
