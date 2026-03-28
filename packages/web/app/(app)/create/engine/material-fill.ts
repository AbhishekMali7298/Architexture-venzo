export function traceRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceWidth =
    image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof ImageBitmap
      ? image.width
      : width;
  const sourceHeight =
    image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof ImageBitmap
      ? image.height
      : height;

  const scale = Math.max(width / Math.max(sourceWidth, 1), height / Math.max(sourceHeight, 1));
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

export function fillMaterialSurface(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    fallbackFill: string;
    image?: CanvasImageSource | null;
  },
) {
  const { x, y, width, height, radius, fallbackFill, image } = options;

  if (radius > 0) {
    traceRoundedRectPath(ctx, x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.closePath();
  }

  ctx.save();
  ctx.clip();

  if (image) {
    drawImageCover(ctx, image, x, y, width, height);
  } else {
    ctx.fillStyle = fallbackFill;
    ctx.fillRect(x, y, width, height);
  }

  ctx.restore();
}
