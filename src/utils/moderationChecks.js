const { MessageFlags } = require('discord.js');
const { createErrorEmbed } = require('./embeds');

async function replyModerationError(interaction, description) {
  await interaction.reply({
    embeds: [createErrorEmbed('Moderation blocked', description)],
    flags: MessageFlags.Ephemeral,
  });
}

async function ensureModerationTarget(interaction, member, action) {
  if (!member) {
    await replyModerationError(interaction, 'Member not found in this server.');
    return false;
  }

  if (member.id === interaction.user.id) {
    await replyModerationError(interaction, `You cannot ${action} yourself.`);
    return false;
  }

  if (member.id === interaction.client.user.id) {
    await replyModerationError(interaction, `You cannot ${action} the bot itself.`);
    return false;
  }

  if (interaction.guild.ownerId === member.id) {
    await replyModerationError(interaction, `You cannot ${action} the server owner.`);
    return false;
  }

  const actorMember = interaction.member;

  if (
    actorMember.roles &&
    member.roles &&
    interaction.guild.ownerId !== interaction.user.id &&
    actorMember.roles.highest.comparePositionTo(member.roles.highest) <= 0
  ) {
    await replyModerationError(
      interaction,
      `Your highest role must be above ${member.user.tag}'s highest role to ${action} this member.`
    );
    return false;
  }

  const botMember = interaction.guild.members.me;

  if (
    !botMember ||
    !botMember.roles ||
    !member.roles ||
    botMember.roles.highest.comparePositionTo(member.roles.highest) <= 0
  ) {
    await replyModerationError(
      interaction,
      `The bot role must be above ${member.user.tag}'s highest role to ${action} this member.`
    );
    return false;
  }

  const capabilityCheck = action === 'ban' ? member.bannable : member.moderatable;

  if (!capabilityCheck) {
    await replyModerationError(
      interaction,
      `Discord is refusing this ${action} action. Check the bot permissions and role hierarchy.`
    );
    return false;
  }

  return true;
}

module.exports = {
  ensureModerationTarget,
};