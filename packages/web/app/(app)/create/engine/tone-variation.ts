function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashToUnit(seed: number) {
  const x = Math.sin(seed) * 43758.5453123;
  return x - Math.floor(x);
}

export function getToneVariationShift(
  toneVariation: number,
  seed: number,
  tileIndex: number,
  repeatX = 0,
  repeatY = 0,
) {
  const strength = clamp(toneVariation / 100, 0, 1);
  if (strength <= 0.0001) {
    return 0;
  }

  const baseSeed =
    seed * 0.013 +
    tileIndex * 17.371 +
    repeatX * 101.93 +
    repeatY * 151.61;
  const rand = hashToUnit(baseSeed + 0.123);

  return (rand - 0.5) * 2 * strength;
}
