const { MessageFlags, PermissionsBitField } = require('discord.js');
const { createErrorEmbed } = require('./embeds');

async function ensurePermissions(interaction, permissions, description = 'the required permissions') {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  if (interaction.memberPermissions?.has(requiredPermissions)) {
    return true;
  }

  await interaction.reply({
    embeds: [
      createErrorEmbed('Permission denied', `You need ${description} to use this command.`),
    ],
    flags: MessageFlags.Ephemeral,
  });

  return false;
}

function formatPermissionDescription(permissions) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  return requiredPermissions
    .map((permission) =>
      Object.entries(PermissionsBitField.Flags).find(([, value]) => value === permission)?.[0] ?? 'Unknown'
    )
    .join(', ');
}

async function ensureModerator(interaction, permissions) {
  return ensurePermissions(
    interaction,
    permissions,
    formatPermissionDescription(permissions)
  );
}

module.exports = { ensureModerator, ensurePermissions };