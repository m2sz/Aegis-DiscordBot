const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    modLogChannelId: {
      type: String,
      default: null,
    },
    ticketCategoryId: {
      type: String,
      default: null,
    },
    ticketArchiveChannelId: {
      type: String,
      default: null,
    },
    ticketPanelChannelId: {
      type: String,
      default: null,
    },
    supportRoleIds: {
      type: [String],
      default: [],
    },
    economy: {
      dailyAmount: {
        type: Number,
        default: 250,
      },
      dailyCooldownHours: {
        type: Number,
        default: 24,
      },
      dailyStreakBonus: {
        type: Number,
        default: 40,
      },
      dailyRandomBonusMax: {
        type: Number,
        default: 120,
      },
      workMin: {
        type: Number,
        default: 120,
      },
      workMax: {
        type: Number,
        default: 340,
      },
      workCooldownMinutes: {
        type: Number,
        default: 90,
      },
      coinflipMinBet: {
        type: Number,
        default: 10,
      },
      coinflipMaxBet: {
        type: Number,
        default: 50000,
      },
      slotsMinBet: {
        type: Number,
        default: 10,
      },
      slotsMaxBet: {
        type: Number,
        default: 50000,
      },
    },
    counters: {
      moderationCase: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GuildConfig', guildConfigSchema);