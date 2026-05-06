import fs from 'node:fs';

const svg = fs.readFileSync('packages/web/public/patterns/impress/chisel pattern.svg', 'utf8');
const pathMatches = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*>/gi)];

let inside = 0;
let outside = 0;
let overlapping = 0;

function parsePathPoints(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const points = [];
  for (let i = 0; i < tokens.length; i++) {
    const val = Number(tokens[i]);
    if (!isNaN(val)) {
       // This is a very crude parser just to get coordinates
       if (i + 1 < tokens.length && !isNaN(Number(tokens[i+1]))) {
         points.push({x: val, y: Number(tokens[i+1])});
         i++;
       }
    }
  }
  return points;
}

for (const match of pathMatches) {
  const d = match[1];
  const points = parsePathPoints(d);
  if (points.length === 0) continue;

  let minX = Math.min(...points.map(p => p.x));
  let maxX = Math.max(...points.map(p => p.x));
  let minY = Math.min(...points.map(p => p.y));
  let maxY = Math.max(...points.map(p => p.y));

  const isInside = minX >= 0 && maxX <= 2000 && minY >= 0 && maxY <= 2000;
  const isOutside = maxX < 0 || minX > 2000 || maxY < 0 || minY > 2000;

  if (inside + outside + overlapping < 10) {
    console.log(`Bounds: [${minX}, ${minY}] to [${maxX}, ${maxY}]`);
  }
  if (isInside) inside++;
  else if (isOutside) outside++;
  else overlapping++;
}

console.log(`Inside: ${inside}, Outside: ${outside}, Overlapping: ${overlapping}`);
