const fs = require('fs');
const path = require('path');

try {
  const filesToPatch = [
    path.join(__dirname, '../node_modules/next/dist/server/app-render/entry-base.js'),
    path.join(__dirname, '../node_modules/next/dist/esm/server/app-render/entry-base.js'),
  ];

  filesToPatch.forEach((filePath) => {
    try {
      if (!fs.existsSync(filePath)) return;
      let content = fs.readFileSync(filePath, 'utf8');

      if (content.includes("require('../../next-devtools/userspace/app/segment-explorer-node')")) {
        content = content.replace(
          /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\)\s*\{\s*(?:const\s+mod\s*=\s*)?require\(['"]\.\.\/\.\.\/next-devtools\/userspace\/app\/segment-explorer-node['"]\)[^;]*;?\s*SegmentViewNode\s*=\s*mod\.SegmentViewNode;?\s*SegmentViewStateNode\s*=\s*mod\.SegmentViewStateNode;?\s*\}/g,
          "SegmentViewNode = (param) => (param && param.children ? param.children : null);\nSegmentViewStateNode = () => null;"
        );
        fs.writeFileSync(filePath, content, 'utf8');
      }
    } catch {
      // Ignore individual file patching errors
    }
  });
} catch {
  // Gracefully continue
}
process.exit(0);
