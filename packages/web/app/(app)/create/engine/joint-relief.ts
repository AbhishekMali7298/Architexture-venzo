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
    0.06,
    (shadowOpacity / 100) * 0.18 + (recess ? 0.08 : 0) + (concave ? 0.05 : 0),
  );
  const outerBand = Math.max(1.25, Math.min(width, height) * (concave ? 0.09 : 0.07), scale * (recess ? 2.2 : 1.5));
  const innerBand = Math.max(0.75, outerBand * (concave ? 0.55 : 0.35));
  const inset = concave ? Math.max(0.5, scale * 0.6) : 0;
  const highlightAlpha = Math.min(0.2, reliefStrength * (recess ? 0.95 : 0.7));
  const shadowAlpha = Math.min(0.24, reliefStrength * (recess ? 1.15 : 0.85));

  ctx.save();
  tracePath();
  ctx.clip();

  const topHighlight = ctx.createLinearGradient(0, y + inset, 0, y + outerBand);
  topHighlight.addColorStop(0, `rgba(255,255,255,${highlightAlpha})`);
  topHighlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = topHighlight;
  ctx.fillRect(x, y, width, outerBand);

  const leftHighlight = ctx.createLinearGradient(x + inset, 0, x + outerBand, 0);
  leftHighlight.addColorStop(0, `rgba(255,255,255,${highlightAlpha * 0.9})`);
  leftHighlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = leftHighlight;
  ctx.fillRect(x, y, outerBand, height);

  const bottomShadow = ctx.createLinearGradient(0, y + height - outerBand, 0, y + height - inset);
  bottomShadow.addColorStop(0, 'rgba(0,0,0,0)');
  bottomShadow.addColorStop(1, `rgba(0,0,0,${shadowAlpha})`);
  ctx.fillStyle = bottomShadow;
  ctx.fillRect(x, y + height - outerBand, width, outerBand);

  const rightShadow = ctx.createLinearGradient(x + width - outerBand, 0, x + width - inset, 0);
  rightShadow.addColorStop(0, 'rgba(0,0,0,0)');
  rightShadow.addColorStop(1, `rgba(0,0,0,${shadowAlpha * 0.95})`);
  ctx.fillStyle = rightShadow;
  ctx.fillRect(x + width - outerBand, y, outerBand, height);

  if (concave) {
    const topInnerShadow = ctx.createLinearGradient(0, y + outerBand * 0.35, 0, y + outerBand + innerBand);
    topInnerShadow.addColorStop(0, 'rgba(0,0,0,0)');
    topInnerShadow.addColorStop(0.55, `rgba(0,0,0,${shadowAlpha * 0.55})`);
    topInnerShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topInnerShadow;
    ctx.fillRect(x, y, width, outerBand + innerBand);

    const leftInnerShadow = ctx.createLinearGradient(x + outerBand * 0.35, 0, x + outerBand + innerBand, 0);
    leftInnerShadow.addColorStop(0, 'rgba(0,0,0,0)');
    leftInnerShadow.addColorStop(0.55, `rgba(0,0,0,${shadowAlpha * 0.5})`);
    leftInnerShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = leftInnerShadow;
    ctx.fillRect(x, y, outerBand + innerBand, height);
  }

  ctx.restore();
}
