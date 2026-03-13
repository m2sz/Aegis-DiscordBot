const mongoose = require('mongoose');

const moderationCaseSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true,
    },
    caseNumber: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    moderatorId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

moderationCaseSchema.index({ guildId: 1, caseNumber: 1 }, { unique: true });

module.exports = mongoose.model('ModerationCase', moderationCaseSchema);