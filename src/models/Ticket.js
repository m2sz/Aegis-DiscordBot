const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true,
    },
    channelId: {
      type: String,
      required: true,
      unique: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    participantIds: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    claimedById: {
      type: String,
      default: null,
    },
    closedById: {
      type: String,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ guildId: 1, ownerId: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);