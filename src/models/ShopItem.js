const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    rarity: {
      type: String,
      default: 'Common',
      trim: true,
      maxlength: 20,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 280,
    },
    effect: {
      type: String,
      required: true,
      enum: ['crate', 'reset_work', 'bank_interest'],
      default: 'crate',
    },
    effectData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

shopItemSchema.index({ guildId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('ShopItem', shopItemSchema);