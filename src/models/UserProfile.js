const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    wallet: {
      type: Number,
      default: 0,
      min: 0,
    },
    bank: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    warningsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyCooldownAt: {
      type: Date,
      default: null,
    },
    dailyStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    workCooldownAt: {
      type: Date,
      default: null,
    },
    lastWorkType: {
      type: String,
      default: null,
    },
    inventory: {
      type: [
        {
          itemId: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userProfileSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);