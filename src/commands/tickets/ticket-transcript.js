const { AttachmentBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { getTicketByChannel } = require('../../services/ticketService');

function sanitizeContent(text) {
  return text.replace(/\r?\n/g, ' ').trim();
}

async function fetchRecentMessages(channel, requestedLimit) {
  const target = Math.min(Math.max(requestedLimit, 1), 300);
  const collected = [];
  let beforeId;

  while (collected.length < target) {
    const remaining = target - collected.length;
    const batchSize = Math.min(100, remaining);
    const batch = await channel.messages.fetch({
      limit: batchSize,
      ...(beforeId ? { before: beforeId } : {}),
    });

    if (!batch.size) {
      break;
    }

    const sortedBatch = [...batch.values()].sort(
      (left, right) => right.createdTimestamp - left.createdTimestamp
    );
    collected.push(...sortedBatch);
    beforeId = sortedBatch[sortedBatch.length - 1].id;

    if (batch.size < batchSize) {
      break;
    }
  }

  return collected
    .slice(0, target)
    .sort((left, right) => left.createdTimestamp - right.createdTimestamp);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-transcript')
    .setDescription('Export the latest ticket messages to a transcript file.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Number of recent messages to export (max 300)')
        .setMinValue(20)
        .setMaxValue(300)
    ),
  async execute(interaction) {
    const ticket = await getTicketByChannel(interaction.channel.id);

    if (!ticket) {
      await interaction.reply({
        embeds: [createErrorEmbed('Invalid channel', 'This command can only be used in a ticket channel.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const limit = interaction.options.getInteger('limit') ?? 150;
    const orderedMessages = await fetchRecentMessages(interaction.channel, limit);

    const lines = orderedMessages.map((message) => {
      const timestamp = new Date(message.createdTimestamp).toISOString();
      const content = sanitizeContent(message.content || '[no text content]');
      return `[${timestamp}] ${message.author.tag}: ${content}`;
    });

    const transcriptBuffer = Buffer.from(lines.join('\n'), 'utf8');
    const transcriptFile = new AttachmentBuilder(transcriptBuffer, {
      name: `ticket-${interaction.channel.id}-transcript.txt`,
    });

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'Transcript generated',
          `Exported ${orderedMessages.length} message(s) from this ticket.`
        ),
      ],
      files: [transcriptFile],
      flags: MessageFlags.Ephemeral,
    });
  },
};