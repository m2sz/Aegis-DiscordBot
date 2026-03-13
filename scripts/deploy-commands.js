const path = require('node:path');
const { REST, Routes } = require('discord.js');
const env = require('../src/config/env');
const { walkFiles } = require('../src/utils/walkFiles');

async function deployCommands() {
  const commandDirectory = path.join(__dirname, '..', 'src', 'commands');
  const commandFiles = walkFiles(commandDirectory);
  const commandPayload = commandFiles.map((filePath) => require(filePath).data.toJSON());
  const rest = new REST({ version: '10' }).setToken(env.discordToken);

  if (env.discordGuildId) {
    await rest.put(Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId), {
      body: commandPayload,
    });
    return;
  }

  await rest.put(Routes.applicationCommands(env.discordClientId), { body: commandPayload });
}

deployCommands().then(() => {
  console.log('Slash commands deployed successfully.');
}).catch((error) => {
  console.error('Failed to deploy slash commands:', error);
  process.exitCode = 1;
});