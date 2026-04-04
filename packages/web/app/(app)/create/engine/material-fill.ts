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

export function tracePolygonPath(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<{ x: number; y: number }>,
) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (let index = 1; index < points.length; index++) {
    const point = points[index]!;
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  imageDrawBox?: { x: number; y: number; width: number; height: number },
  randomCropFraction?: { x: number; y: number },
) {
  const sourceWidth =
    image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof ImageBitmap
      ? image.width
      : width;
  const sourceHeight =
    image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof ImageBitmap
      ? image.height
      : height;

  const targetBox = imageDrawBox ?? { x, y, width, height };
  // When random crop is requested, scale image 1.4× so there is always
  // overshoot to shift within — the clip path hides anything outside the tile.
  const coverScale = Math.max(
    targetBox.width / Math.max(sourceWidth, 1),
    targetBox.height / Math.max(sourceHeight, 1),
  );
  const overshootScale = randomCropFraction ? coverScale * 1.4 : coverScale;
  const drawWidth = sourceWidth * overshootScale;
  const drawHeight = sourceHeight * overshootScale;

  let drawX: number;
  let drawY: number;
  if (randomCropFraction) {
    const maxShiftX = Math.max(0, drawWidth - targetBox.width);
    const maxShiftY = Math.max(0, drawHeight - targetBox.height);
    drawX = targetBox.x - randomCropFraction.x * maxShiftX;
    drawY = targetBox.y - randomCropFraction.y * maxShiftY;
  } else {
    drawX = targetBox.x + (targetBox.width - drawWidth) / 2;
    drawY = targetBox.y + (targetBox.height - drawHeight) / 2;
  }

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
    tintColor?: string | null;
    clipPath?: ReadonlyArray<{ x: number; y: number }>;
    imageDrawBox?: { x: number; y: number; width: number; height: number };
    /** Per-tile random crop fractions (0–1). When provided each tile shows a
     *  different portion of the source image rather than the centred crop. */
    randomCropFraction?: { x: number; y: number };
  },
) {
  const { x, y, width, height, radius, fallbackFill, image, tintColor, clipPath, imageDrawBox, randomCropFraction } = options;

  if (clipPath?.length) {
    tracePolygonPath(ctx, clipPath);
  } else if (radius > 0) {
    traceRoundedRectPath(ctx, x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.closePath();
  }

  ctx.save();
  ctx.clip();

  if (image) {
    drawImageCover(ctx, image, x, y, width, height, imageDrawBox, randomCropFraction);
    if (tintColor) {
      ctx.fillStyle = tintColor;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(x, y, width, height);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = tintColor;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  } else {
    ctx.fillStyle = fallbackFill;
    ctx.fillRect(x, y, width, height);
  }

  ctx.restore();
}
