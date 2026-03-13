const { MessageFlags } = require('discord.js');
const logger = require('../config/logger');
const { createErrorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          return;
        }

        await command.execute(interaction, { client });
        return;
      }

      if (interaction.isButton()) {
        const handler = client.buttonHandlers.find(
          (entry) => entry.customId === interaction.customId || entry.matches?.(interaction.customId)
        );

        if (!handler) {
          return;
        }

        await handler.execute(interaction, { client });
      }
    } catch (error) {
      logger.error('Interaction handler failed', {
        interactionId: interaction.id,
        customId: interaction.customId,
        commandName: interaction.commandName,
        code: error.code,
        message: error.message,
      });

      const description = error.code === 50013
        ? 'Discord rejected this action because of missing permissions or role hierarchy. Check that the bot role is above the target member and that the bot has the required moderation permissions.'
        : 'An unexpected error occurred while processing this interaction.';

      const payload = {
        embeds: [
          createErrorEmbed('Action failed', description),
        ],
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
        return;
      }

      await interaction.reply(payload);
    }
  },
};