export function drawJointRelief(
  ctx: CanvasRenderingContext2D,
  options: {
    tracePath: () => void;
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    shadowOpacity: number;
    recess: boolean;
    concave: boolean;
  },
) {
  const { tracePath, x, y, width, height, scale, shadowOpacity, recess, concave } = options;
  if ((!recess && !concave) || width <= 0 || height <= 0) return;

  const reliefStrength = Math.max(
    0.12,
    (shadowOpacity / 100) * 0.24 + (recess ? 0.14 : 0) + (concave ? 0.08 : 0),
  );
  const insetX = Math.max(0, x);
  const insetY = Math.max(0, y);
  const outerBandX = Math.max(
    1.35,
    scale * (recess ? 2.2 : 1.7),
    Math.min(Math.max(insetX * 1.15, 0), Math.max(width * 0.12, 1)),
  );
  const outerBandY = Math.max(
    1.35,
    scale * (recess ? 2.2 : 1.7),
    Math.min(Math.max(insetY * 1.15, 0), Math.max(height * 0.18, 1)),
  );
  const innerBandX = Math.max(0.85, outerBandX * (concave ? 0.72 : 0.42));
  const innerBandY = Math.max(0.85, outerBandY * (concave ? 0.72 : 0.42));
  const inset = concave ? Math.max(0.5, scale * 0.6) : 0;
  const highlightAlpha = Math.min(recess ? 0.26 : 0.2, reliefStrength * (recess ? 1.05 : 0.82));
  const shadowAlpha = Math.min(recess ? 0.38 : 0.3, reliefStrength * (recess ? 1.22 : 0.95));
  const edgeLineWidth = Math.max(0.9, scale * 0.9);

  ctx.save();
  tracePath();
  ctx.clip();

  const topHighlight = ctx.createLinearGradient(0, y + inset, 0, y + outerBandY);
  topHighlight.addColorStop(0, `rgba(255,255,255,${highlightAlpha})`);
  topHighlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = topHighlight;
  ctx.fillRect(x, y, width, outerBandY);

  const leftHighlight = ctx.createLinearGradient(x + inset, 0, x + outerBandX, 0);
  leftHighlight.addColorStop(0, `rgba(255,255,255,${highlightAlpha * 0.9})`);
  leftHighlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = leftHighlight;
  ctx.fillRect(x, y, outerBandX, height);

  const bottomShadow = ctx.createLinearGradient(0, y + height - outerBandY, 0, y + height - inset);
  bottomShadow.addColorStop(0, 'rgba(0,0,0,0)');
  bottomShadow.addColorStop(1, `rgba(0,0,0,${shadowAlpha})`);
  ctx.fillStyle = bottomShadow;
  ctx.fillRect(x, y + height - outerBandY, width, outerBandY);

  const rightShadow = ctx.createLinearGradient(x + width - outerBandX, 0, x + width - inset, 0);
  rightShadow.addColorStop(0, 'rgba(0,0,0,0)');
  rightShadow.addColorStop(1, `rgba(0,0,0,${shadowAlpha * 0.95})`);
  ctx.fillStyle = rightShadow;
  ctx.fillRect(x + width - outerBandX, y, outerBandX, height);

  if (recess) {
    ctx.fillStyle = `rgba(255,255,255,${highlightAlpha * 0.65})`;
    ctx.fillRect(x, y, width, edgeLineWidth);
    ctx.fillRect(x, y, edgeLineWidth, height);

    ctx.fillStyle = `rgba(0,0,0,${shadowAlpha * 0.78})`;
    ctx.fillRect(x, y + height - edgeLineWidth, width, edgeLineWidth);
    ctx.fillRect(x + width - edgeLineWidth, y, edgeLineWidth, height);
  }

  if (concave) {
    const topInnerShadow = ctx.createLinearGradient(0, y + outerBandY * 0.35, 0, y + outerBandY + innerBandY);
    topInnerShadow.addColorStop(0, 'rgba(0,0,0,0)');
    topInnerShadow.addColorStop(0.55, `rgba(0,0,0,${shadowAlpha * 0.55})`);
    topInnerShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topInnerShadow;
    ctx.fillRect(x, y, width, outerBandY + innerBandY);

    const leftInnerShadow = ctx.createLinearGradient(x + outerBandX * 0.35, 0, x + outerBandX + innerBandX, 0);
    leftInnerShadow.addColorStop(0, 'rgba(0,0,0,0)');
    leftInnerShadow.addColorStop(0.55, `rgba(0,0,0,${shadowAlpha * 0.5})`);
    leftInnerShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = leftInnerShadow;
    ctx.fillRect(x, y, outerBandX + innerBandX, height);
  }

  ctx.restore();
}
