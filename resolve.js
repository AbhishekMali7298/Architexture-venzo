const fs = require('fs');

const files = [
  'packages/web/app/(app)/create/engine/background-renderer.ts',
  'packages/web/app/(app)/create/engine/material-renderer.ts',
  'packages/web/app/(app)/create/lib/project-export.ts',
  'packages/web/public/patterns/_pattern-map.json'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // A simple strategy: we'll keep the HEAD (local) changes for the pattern-map and project-export since they are likely additions.
  // For renderers, it's tricky. Let's just output the conflicts so we can see them.
  console.log('--- ' + file + ' ---');
  const matches = content.match(/<<<<<<< HEAD[\s\S]*?=======\n([\s\S]*?)>>>>>>> [a-z0-9]+/g);
  if (matches) {
    console.log(`Found ${matches.length} conflicts in ${file}`);
  }
}
