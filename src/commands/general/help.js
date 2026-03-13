const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

function groupCommands(commands) {
  const grouped = {
    General: [],
    Economy: [],
    Moderation: [],
    Tickets: [],
  };

  for (const command of commands) {
    const commandName = command.data.name;
    const entry = `</${commandName}:${command.id ?? commandName}> - ${command.data.description}`;

    if (['balance', 'buy', 'coinflip', 'daily', 'deposit', 'eco-add', 'eco-config', 'eco-remove', 'eco-set', 'inventory', 'leaderboard', 'pay', 'shop', 'shop-manage', 'slots', 'use-item', 'withdraw', 'work'].includes(commandName)) {
      grouped.Economy.push(entry);
      continue;
    }

    if (['ban', 'cases', 'purge', 'timeout', 'unban', 'warn'].includes(commandName)) {
      grouped.Moderation.push(entry);
      continue;
    }

    if (['ticket-add', 'ticket-panel', 'ticket-remove', 'ticket-reopen', 'ticket-settings', 'ticket-transcript'].includes(commandName)) {
      grouped.Tickets.push(entry);
      continue;
    }

    grouped.General.push(entry);
  }

  return grouped;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display the available commands for this bot.'),
  async execute(interaction, { client }) {
    const commands = [...client.commands.values()].sort((left, right) =>
      left.data.name.localeCompare(right.data.name)
    );
    const groupedCommands = groupCommands(commands);
    const embed = createInfoEmbed(
      'Command Center',
      'Browse the command set below. Permissions still apply based on your Discord role.'
    );

    for (const [section, entries] of Object.entries(groupedCommands)) {
      if (!entries.length) {
        continue;
      }

      embed.addFields({
        name: section,
        value: entries.join('\n'),
      });
    }

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};