const path = require('node:path');
const { walkFiles } = require('../utils/walkFiles');

function registerButtonHandlers(client) {
  const interactionsDirectory = path.join(__dirname, '..', 'interactions', 'buttons');
  const interactionFiles = walkFiles(interactionsDirectory);

  for (const filePath of interactionFiles) {
    const handler = require(filePath);

    if (!handler.execute || (!handler.customId && !handler.matches)) {
      throw new Error(`Invalid button interaction module: ${filePath}`);
    }

    client.buttonHandlers.push(handler);
  }
}

module.exports = { registerButtonHandlers };