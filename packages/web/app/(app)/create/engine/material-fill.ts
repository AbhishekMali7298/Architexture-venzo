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
) {
  const sourceWidth =
    image instanceof HTMLImageElement ? image.naturalWidth :
    image instanceof HTMLCanvasElement ? image.width :
    image instanceof ImageBitmap ? image.width :
    image instanceof HTMLVideoElement ? image.videoWidth :
    width;
  const sourceHeight =
    image instanceof HTMLImageElement ? image.naturalHeight :
    image instanceof HTMLCanvasElement ? image.height :
    image instanceof ImageBitmap ? image.height :
    image instanceof HTMLVideoElement ? image.videoHeight :
    height;

  const targetBox = imageDrawBox ?? { x, y, width, height };
  const scale = Math.max(
    targetBox.width / Math.max(sourceWidth, 1),
    targetBox.height / Math.max(sourceHeight, 1),
  );
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = targetBox.x + (targetBox.width - drawWidth) / 2;
  const drawY = targetBox.y + (targetBox.height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

export function createMaterialPattern(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageDrawBox?: { x: number; y: number; width: number; height: number },
) {
  const sourceWidth =
    image instanceof HTMLImageElement ? image.naturalWidth :
    image instanceof HTMLCanvasElement ? image.width :
    image instanceof ImageBitmap ? image.width :
    image instanceof HTMLVideoElement ? image.videoWidth : 1000;
  const sourceHeight =
    image instanceof HTMLImageElement ? image.naturalHeight :
    image instanceof HTMLCanvasElement ? image.height :
    image instanceof ImageBitmap ? image.height :
    image instanceof HTMLVideoElement ? image.videoHeight : 1000;

  const targetBox = imageDrawBox ?? { x: 0, y: 0, width: 1000, height: 1000 };
  const patternScale = Math.max(
    targetBox.width / Math.max(sourceWidth, 1),
    targetBox.height / Math.max(sourceHeight, 1),
  );

  const pattern = ctx.createPattern(image, 'repeat');
  if (!pattern) return null;

  if (typeof pattern.setTransform === 'function') {
    pattern.setTransform(new DOMMatrix([
      patternScale, 0,
      0, patternScale,
      targetBox.x, targetBox.y,
    ]));
  }

  return pattern;
}

function drawImageRepeatPattern(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  imageDrawBox?: { x: number; y: number; width: number; height: number },
) {
  const pattern = createMaterialPattern(ctx, image, imageDrawBox);
  if (!pattern) {
    drawImageCover(ctx, image, x, y, width, height, imageDrawBox);
    return;
  }

  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, width, height);
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
    clipPath?: ReadonlyArray<{ x: number; y: number }>;
    imageDrawBox?: { x: number; y: number; width: number; height: number };
    isStroke?: boolean;
    strokeWidth?: number;
    isClosed?: boolean;
  },
) {
  const {
    x,
    y,
    width,
    height,
    radius,
    fallbackFill,
    image,
    clipPath,
    imageDrawBox,
    isStroke,
    strokeWidth,
    isClosed,
  } = options;

  if (clipPath?.length) {
    if (isStroke) {
      ctx.beginPath();
      ctx.moveTo(clipPath[0]!.x, clipPath[0]!.y);
      for (let index = 1; index < clipPath.length; index++) {
        ctx.lineTo(clipPath[index]!.x, clipPath[index]!.y);
      }
      if (isClosed) ctx.closePath();
    } else {
      tracePolygonPath(ctx, clipPath);
    }
  } else if (radius > 0) {
    traceRoundedRectPath(ctx, x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.closePath();
  }

  if (isStroke) {
    ctx.lineWidth = strokeWidth || 1;
    if (image) {
      const pattern = createMaterialPattern(ctx, image, imageDrawBox);
      if (pattern) {
        ctx.strokeStyle = pattern;
        ctx.stroke();
      } else {
        ctx.strokeStyle = fallbackFill;
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = fallbackFill;
      ctx.stroke();
    }
    return;
  }

  ctx.save();
  ctx.clip();

  if (image) {
    drawImageRepeatPattern(ctx, image, x, y, width, height, imageDrawBox);
  } else {
    ctx.fillStyle = fallbackFill;
    ctx.fillRect(x, y, width, height);
  }

  ctx.restore();
}

