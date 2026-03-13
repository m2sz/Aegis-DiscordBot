const fs = require('node:fs');
const path = require('node:path');

function walkFiles(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return walkFiles(absolutePath);
    }

    return absolutePath.endsWith('.js') ? [absolutePath] : [];
  });
}

module.exports = { walkFiles };