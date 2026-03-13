const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const env = require('./config/env');
const logger = require('./config/logger');
const { registerCommands } = require('./handlers/commandHandler');
const { registerEvents } = require('./handlers/eventHandler');
const { registerButtonHandlers } = require('./handlers/interactionHandler');
const { connectDatabase } = require('./services/database');

async function bootstrap() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  client.commands = new Collection();
  client.buttonHandlers = [];

  registerCommands(client);
  registerButtonHandlers(client);
  registerEvents(client);

  await connectDatabase();
  await client.login(env.discordToken);
}

bootstrap().catch((error) => {
  logger.error('Failed to bootstrap bot', { message: error.message, stack: error.stack });
  process.exitCode = 1;
});