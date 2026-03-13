const path = require('node:path');
const { walkFiles } = require('../utils/walkFiles');

function registerEvents(client) {
  const eventDirectory = path.join(__dirname, '..', 'events');
  const eventFiles = walkFiles(eventDirectory);

  for (const filePath of eventFiles) {
    const event = require(filePath);

    if (!event.name || !event.execute) {
      throw new Error(`Invalid event module: ${filePath}`);
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
      continue;
    }

    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

module.exports = { registerEvents };