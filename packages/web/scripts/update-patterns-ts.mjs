import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.join(process.cwd(), 'packages/shared/src/constants/patterns.ts');

async function main() {
  const content = await fs.readFile(file, 'utf8');
  
  // Replace previewAssetPath: 'patterns/something.svg' with previewAssetPath: 'patterns/{type}.svg'
  const updated = content.replace(/type:\s*'([^']+)'[\s\S]*?previewAssetPath:\s*'([^']+)'/g, (match, type, oldPath) => {
    return match.replace(oldPath, `patterns/${type}.svg`);
  });
  
  await fs.writeFile(file, updated, 'utf8');
  console.log('Updated patterns.ts');
}

main().catch(console.error);
