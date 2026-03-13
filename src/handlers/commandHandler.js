const path = require('node:path');
const { walkFiles } = require('../utils/walkFiles');

function registerCommands(client) {
  const commandDirectory = path.join(__dirname, '..', 'commands');
  const commandFiles = walkFiles(commandDirectory);

  for (const filePath of commandFiles) {
    const command = require(filePath);

    if (!command.data || !command.execute) {
      throw new Error(`Invalid command module: ${filePath}`);
    }

    client.commands.set(command.data.name, command);
  }
}

module.exports = { registerCommands };