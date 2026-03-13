const UserProfile = require('../models/UserProfile');
const ShopItem = require('../models/ShopItem');
const { getEconomySettings } = require('./guildConfigService');

const workActivities = [
  'closed premium support tickets',
  'optimized the server storefront',
  'ran a sponsored event',
  'handled an emergency moderation wave',
  'delivered a custom commission',
  'managed a limited stock restock',
];

const shopCatalog = [
  {
    id: 'mystery_crate',
    name: 'Mystery Crate',
    price: 450,
    rarity: 'Common',
    description: 'Open it to receive a random cash reward.',
    effect: 'crate',
  },
  {
    id: 'work_permit',
    name: 'Work Permit',
    price: 650,
    rarity: 'Uncommon',
    description: 'Use it to reset your /work cooldown instantly.',
    effect: 'reset_work',
  },
  {
    id: 'vault_bond',
    name: 'Vault Bond',
    price: 900,
    rarity: 'Rare',
    description: 'Use it to earn interest from your bank holdings.',
    effect: 'bank_interest',
  },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function ensureDefaultShopItems(guildId) {
  const existingCount = await ShopItem.countDocuments({ guildId });

  if (existingCount > 0) {
    return;
  }

  await ShopItem.insertMany(
    shopCatalog.map((item) => ({
      guildId,
      itemId: item.id,
      name: item.name,
      price: item.price,
      rarity: item.rarity,
      description: item.description,
      effect: item.effect,
      effectData: {},
      isEnabled: true,
    }))
  );
}

async function getShopItemById(guildId, itemId) {
  await ensureDefaultShopItems(guildId);
  return ShopItem.findOne({ guildId, itemId: itemId.toLowerCase(), isEnabled: true });
}

function normalizeShopItemInput(input) {
  return {
    itemId: String(input.itemId)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 40),
    name: String(input.name).trim().slice(0, 60),
    price: Number.parseInt(String(input.price), 10),
    rarity: String(input.rarity ?? 'Common').trim().slice(0, 20),
    description: String(input.description ?? '').trim().slice(0, 280),
    effect: String(input.effect).trim(),
    effectData: input.effectData ?? {},
    isEnabled: input.isEnabled ?? true,
  };
}

function addInventoryItem(profile, itemId, quantity) {
  const existing = profile.inventory.find((entry) => entry.itemId === itemId);

  if (existing) {
    existing.quantity += quantity;
    return;
  }

  profile.inventory.push({ itemId, quantity });
}

function removeInventoryItem(profile, itemId, quantity) {
  const existing = profile.inventory.find((entry) => entry.itemId === itemId);

  if (!existing || existing.quantity < quantity) {
    return false;
  }

  existing.quantity -= quantity;
  profile.inventory = profile.inventory.filter((entry) => entry.quantity > 0);
  return true;
}

function getNetWorth(profile) {
  return profile.wallet + profile.bank;
}

function normalizeCoinSide(side) {
  const normalized = side.toLowerCase();
  return normalized === 'heads' || normalized === 'tails' ? normalized : null;
}

async function getOrCreateProfile(guildId, userId) {
  return UserProfile.findOneAndUpdate(
    { guildId, userId },
    { $setOnInsert: { guildId, userId } },
    { new: true, upsert: true }
  );
}

async function claimDaily(guildId, userId) {
  const profile = await getOrCreateProfile(guildId, userId);
  const economySettings = await getEconomySettings(guildId);
  const dailyAmount = economySettings.dailyAmount;
  const cooldownMs = economySettings.dailyCooldownHours * 60 * 60 * 1000;
  const nextClaimAt = profile.dailyCooldownAt ? profile.dailyCooldownAt.getTime() + cooldownMs : 0;

  if (nextClaimAt > Date.now()) {
    return {
      success: false,
      nextClaimAt: new Date(nextClaimAt),
      amount: dailyAmount,
      profile,
    };
  }

  const lastClaimTime = profile.dailyCooldownAt?.getTime() ?? 0;
  const streakWindowMs = cooldownMs * 2;
  const keepsStreak = lastClaimTime && Date.now() - lastClaimTime <= streakWindowMs;
  const nextStreak = keepsStreak ? profile.dailyStreak + 1 : 1;
  const streakBonus = economySettings.dailyStreakBonus * Math.max(nextStreak - 1, 0);
  const randomBonus = randomInt(0, economySettings.dailyRandomBonusMax);
  const totalReward = dailyAmount + streakBonus + randomBonus;

  profile.wallet += totalReward;
  profile.totalEarned += totalReward;
  profile.dailyCooldownAt = new Date();
  profile.dailyStreak = nextStreak;
  await profile.save();

  return {
    success: true,
    amount: totalReward,
    baseAmount: dailyAmount,
    streakBonus,
    randomBonus,
    streak: nextStreak,
    nextClaimAt: new Date(profile.dailyCooldownAt.getTime() + cooldownMs),
    profile,
  };
}

async function runWork(guildId, userId) {
  const profile = await getOrCreateProfile(guildId, userId);
  const economySettings = await getEconomySettings(guildId);
  const cooldownMs = economySettings.workCooldownMinutes * 60 * 1000;
  const nextWorkAt = profile.workCooldownAt ? profile.workCooldownAt.getTime() + cooldownMs : 0;

  if (nextWorkAt > Date.now()) {
    return {
      success: false,
      nextWorkAt: new Date(nextWorkAt),
      profile,
    };
  }

  const amount = randomInt(economySettings.workMin, economySettings.workMax);
  const activity = workActivities[randomInt(0, workActivities.length - 1)];

  profile.wallet += amount;
  profile.totalEarned += amount;
  profile.workCooldownAt = new Date();
  profile.lastWorkType = activity;
  await profile.save();

  return {
    success: true,
    amount,
    activity,
    nextWorkAt: new Date(profile.workCooldownAt.getTime() + cooldownMs),
    profile,
  };
}

async function depositCredits(guildId, userId, amount) {
  if (amount <= 0) {
    throw new Error('Deposit amount must be greater than zero.');
  }

  const profile = await getOrCreateProfile(guildId, userId);

  if (profile.wallet < amount) {
    throw new Error('Insufficient wallet balance for this deposit.');
  }

  profile.wallet -= amount;
  profile.bank += amount;
  await profile.save();

  return profile;
}

async function withdrawCredits(guildId, userId, amount) {
  if (amount <= 0) {
    throw new Error('Withdraw amount must be greater than zero.');
  }

  const profile = await getOrCreateProfile(guildId, userId);

  if (profile.bank < amount) {
    throw new Error('Insufficient bank balance for this withdrawal.');
  }

  profile.bank -= amount;
  profile.wallet += amount;
  await profile.save();

  return profile;
}

async function transferCredits(guildId, fromUserId, toUserId, amount) {
  if (amount <= 0) {
    throw new Error('Transfer amount must be greater than zero.');
  }

  if (fromUserId === toUserId) {
    throw new Error('You cannot transfer credits to yourself.');
  }

  const sender = await getOrCreateProfile(guildId, fromUserId);

  if (sender.wallet < amount) {
    throw new Error('Insufficient balance for this transfer.');
  }

  const receiver = await getOrCreateProfile(guildId, toUserId);
  sender.wallet -= amount;
  sender.totalSpent += amount;
  receiver.wallet += amount;
  receiver.totalEarned += amount;

  await Promise.all([sender.save(), receiver.save()]);

  return { sender, receiver };
}

async function addMoney(guildId, userId, amount) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  const profile = await getOrCreateProfile(guildId, userId);
  profile.wallet += amount;
  profile.totalEarned += amount;
  await profile.save();
  return profile;
}

async function removeMoney(guildId, userId, amount) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  const profile = await getOrCreateProfile(guildId, userId);

  if (profile.wallet < amount) {
    throw new Error('Insufficient wallet balance for removal.');
  }

  profile.wallet -= amount;
  profile.totalSpent += amount;
  await profile.save();
  return profile;
}

async function setMoney(guildId, userId, amount) {
  if (amount < 0) {
    throw new Error('Wallet value cannot be negative.');
  }

  const profile = await getOrCreateProfile(guildId, userId);
  profile.wallet = amount;
  await profile.save();
  return profile;
}

async function playCoinflip(guildId, userId, bet, side) {
  if (bet <= 0) {
    throw new Error('Bet must be greater than zero.');
  }

  const selectedSide = normalizeCoinSide(side);
  const economySettings = await getEconomySettings(guildId);
  if (bet < economySettings.coinflipMinBet || bet > economySettings.coinflipMaxBet) {
    throw new Error(
      `Bet must be between ${economySettings.coinflipMinBet} and ${economySettings.coinflipMaxBet}.`
    );
  }


  if (!selectedSide) {
    throw new Error('Side must be heads or tails.');
  }

  const profile = await getOrCreateProfile(guildId, userId);

  if (profile.wallet < bet) {
    throw new Error('Insufficient wallet balance for this bet.');
  }

  const rolledSide = Math.random() < 0.5 ? 'heads' : 'tails';
  const isWin = selectedSide === rolledSide;

  if (isWin) {
    profile.wallet += bet;
    profile.totalEarned += bet;
  } else {
    profile.wallet -= bet;
    profile.totalSpent += bet;
  }

  await profile.save();

  return {
    profile,
    selectedSide,
    rolledSide,
    isWin,
    profit: isWin ? bet : -bet,
  };
}

async function playSlots(guildId, userId, bet) {
  if (bet <= 0) {
    throw new Error('Bet must be greater than zero.');
  }

  const economySettings = await getEconomySettings(guildId);

  if (bet < economySettings.slotsMinBet || bet > economySettings.slotsMaxBet) {
    throw new Error(
      `Bet must be between ${economySettings.slotsMinBet} and ${economySettings.slotsMaxBet}.`
    );
  }

  const profile = await getOrCreateProfile(guildId, userId);

  if (profile.wallet < bet) {
    throw new Error('Insufficient wallet balance for this bet.');
  }

  const symbols = ['7', 'BAR', 'CHERRY', 'DIAMOND', 'COIN'];
  const rolls = [
    symbols[randomInt(0, symbols.length - 1)],
    symbols[randomInt(0, symbols.length - 1)],
    symbols[randomInt(0, symbols.length - 1)],
  ];

  let multiplier = 0;

  if (rolls[0] === rolls[1] && rolls[1] === rolls[2]) {
    multiplier = rolls[0] === '7' ? 5 : 3;
  } else if (new Set(rolls).size === 2) {
    multiplier = 1.5;
  } else if (rolls.includes('CHERRY')) {
    multiplier = 1.1;
  }

  const profit = Math.floor(bet * (multiplier - 1));

  if (profit >= 0) {
    profile.wallet += profit;
    profile.totalEarned += profit;
  } else {
    profile.wallet += profit;
    profile.totalSpent += Math.abs(profit);
  }

  await profile.save();

  return {
    profile,
    rolls,
    multiplier,
    profit,
  };
}

async function getShopItems(guildId) {
  return getShopItemsForGuild(guildId);
}

async function getShopItemsForGuild(guildId, includeDisabled = false) {
  await ensureDefaultShopItems(guildId);
  const query = includeDisabled ? { guildId } : { guildId, isEnabled: true };
  return ShopItem.find(query).sort({ price: 1, name: 1 });
}

async function upsertShopItem(guildId, input) {
  const normalized = normalizeShopItemInput(input);

  if (!normalized.itemId) {
    throw new Error('itemId is required.');
  }

  if (!normalized.name) {
    throw new Error('name is required.');
  }

  if (!['crate', 'reset_work', 'bank_interest'].includes(normalized.effect)) {
    throw new Error('effect must be crate, reset_work, or bank_interest.');
  }

  if (Number.isNaN(normalized.price) || normalized.price <= 0) {
    throw new Error('price must be a positive integer.');
  }

  await ensureDefaultShopItems(guildId);

  return ShopItem.findOneAndUpdate(
    { guildId, itemId: normalized.itemId },
    {
      $set: {
        name: normalized.name,
        price: normalized.price,
        rarity: normalized.rarity,
        description: normalized.description,
        effect: normalized.effect,
        effectData: normalized.effectData,
        isEnabled: normalized.isEnabled,
      },
      $setOnInsert: {
        guildId,
        itemId: normalized.itemId,
      },
    },
    { new: true, upsert: true }
  );
}

async function disableShopItem(guildId, itemId) {
  const target = await ShopItem.findOneAndUpdate(
    { guildId, itemId: itemId.toLowerCase() },
    { $set: { isEnabled: false } },
    { new: true }
  );

  if (!target) {
    throw new Error('Shop item not found.');
  }

  return target;
}

async function buyShopItem(guildId, userId, itemId, quantity = 1) {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero.');
  }

  const item = await getShopItemById(guildId, itemId);

  if (!item) {
    throw new Error('Unknown shop item.');
  }

  const profile = await getOrCreateProfile(guildId, userId);
  const totalCost = item.price * quantity;

  if (profile.wallet < totalCost) {
    throw new Error('Insufficient wallet balance for this purchase.');
  }

  profile.wallet -= totalCost;
  profile.totalSpent += totalCost;
  addInventoryItem(profile, item.itemId, quantity);
  await profile.save();

  return {
    item,
    quantity,
    totalCost,
    profile,
  };
}

async function getInventory(guildId, userId) {
  const profile = await getOrCreateProfile(guildId, userId);
  const items = await getShopItemsForGuild(guildId, true);
  const itemMap = new Map(items.map((item) => [item.itemId, item]));
  const inventory = profile.inventory
    .map((entry) => {
      const item = itemMap.get(entry.itemId);

      if (!item) {
        return {
          id: entry.itemId,
          itemId: entry.itemId,
          name: entry.itemId,
          rarity: 'Unknown',
          description: 'This item no longer exists in the shop.',
          quantity: entry.quantity,
        };
      }

      return {
        id: item.itemId,
        itemId: item.itemId,
        name: item.name,
        rarity: item.rarity,
        description: item.description,
        effect: item.effect,
        effectData: item.effectData,
        quantity: entry.quantity,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return { profile, inventory };
}

async function useInventoryItem(guildId, userId, itemId) {
  const item = await ShopItem.findOne({ guildId, itemId: itemId.toLowerCase() });

  if (!item) {
    throw new Error('Unknown inventory item.');
  }

  const profile = await getOrCreateProfile(guildId, userId);
  const removed = removeInventoryItem(profile, item.itemId, 1);

  if (!removed) {
    throw new Error(`You do not own ${item.name}.`);
  }

  let effectDescription = '';

  if (item.effect === 'crate') {
    const crateMin = Number(item.effectData?.min ?? 220);
    const crateMax = Number(item.effectData?.max ?? 1100);
    const payout = randomInt(Math.min(crateMin, crateMax), Math.max(crateMin, crateMax));
    profile.wallet += payout;
    profile.totalEarned += payout;
    effectDescription = `You opened a Mystery Crate and received ${payout} credits.`;
  }

  if (item.effect === 'reset_work') {
    profile.workCooldownAt = null;
    effectDescription = 'Your work cooldown has been reset. You can use /work immediately.';
  }

  if (item.effect === 'bank_interest') {
    const rate = Number(item.effectData?.rate ?? 0.08);
    const minInterest = Number(item.effectData?.min ?? 50);
    const maxInterest = Number(item.effectData?.max ?? 1500);
    const interest = Math.max(
      minInterest,
      Math.min(maxInterest, Math.floor(profile.bank * rate))
    );
    profile.bank += interest;
    profile.totalEarned += interest;
    effectDescription = `Your vault generated ${interest} credits in interest.`;
  }

  await profile.save();

  return {
    item,
    effectDescription,
    profile,
  };
}

async function getLeaderboard(guildId, limit = 10) {
  const profiles = await UserProfile.find({ guildId });
  return profiles
    .sort((left, right) => {
      const worthDifference = getNetWorth(right) - getNetWorth(left);

      if (worthDifference !== 0) {
        return worthDifference;
      }

      return right.totalEarned - left.totalEarned;
    })
    .slice(0, limit);
}

module.exports = {
  getOrCreateProfile,
  claimDaily,
  runWork,
  depositCredits,
  withdrawCredits,
  transferCredits,
  addMoney,
  removeMoney,
  setMoney,
  playCoinflip,
  playSlots,
  getShopItems,
  getShopItemsForGuild,
  upsertShopItem,
  disableShopItem,
  buyShopItem,
  getInventory,
  useInventoryItem,
  getLeaderboard,
  getNetWorth,
};