const { EmbedBuilder } = require('discord.js');

function createBaseEmbed() {
  return new EmbedBuilder().setColor(0x2b2d31).setTimestamp();
}

function createSuccessEmbed(title, description) {
  return createBaseEmbed().setColor(0x3ba55d).setTitle(title).setDescription(description);
}

function createErrorEmbed(title, description) {
  return createBaseEmbed().setColor(0xed4245).setTitle(title).setDescription(description);
}

function createInfoEmbed(title, description) {
  return createBaseEmbed().setColor(0x5865f2).setTitle(title).setDescription(description);
}

module.exports = {
  createBaseEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed,
};