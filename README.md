# Aegis Discord Bot

Aegis is a production-oriented Discord bot built for community operations. It combines structured moderation tooling, a private ticket workflow, and a more bespoke economy loop on top of Node.js, Discord.js, and MongoDB.

## Highlights

- Structured moderation with warnings, timeouts, bans, unbans, purge tools, and persistent case history.
- Ticket workflow with configurable support role access, private channel creation, claiming, and archive handling.
- Server economy with streak-based dailies, work payouts, wallet and bank management, transfers, and a net-worth leaderboard.
- MongoDB persistence for guild configuration, economy profiles, moderation cases, and ticket lifecycle data.
- Modular architecture designed for long-term maintenance and clean feature expansion.

## Stack

- Node.js 20+
- Discord.js 14
- MongoDB with Mongoose
- ESLint for code quality

## Project Structure

```text
.
├── scripts/
│   └── deploy-commands.js
├── src/
│   ├── commands/
│   │   ├── economy/
│   │   ├── moderation/
│   │   └── tickets/
│   ├── config/
│   ├── events/
│   ├── handlers/
│   ├── interactions/
│   │   └── buttons/
│   ├── models/
│   ├── services/
│   ├── utils/
│   └── index.js
├── .env.example
├── eslint.config.js
└── package.json
```

## Features

### Moderation

- `/warn` stores a warning and increments the member warning counter.
- `/timeout` applies timed sanctions with persistent case logging.
- `/ban` and `/unban` track moderation actions with numbered cases.
- `/purge` bulk deletes recent channel messages.
- `/cases` shows the latest moderation actions recorded for a user.
- A moderation log channel is created automatically if none is configured.

### Tickets

- `/ticket-panel` publishes a support panel with a one-click ticket creation button.
- `/ticket-settings` binds open and archive categories plus a support role.
- `/ticket-add` and `/ticket-remove` manage additional participants in active tickets.
- `/ticket-transcript` exports a text transcript of recent ticket messages.
- `/ticket-reopen` reopens archived tickets back into the active queue.
- Ticket channels are private, staff-visible, and organized by category.
- Staff can claim a ticket, and tickets can be closed into an archive section.

### Economy

- `/balance` shows wallet, bank, net worth, streak, and tracked moderation profile data.
- `/daily` grants a recurring reward with streak and random market bonus logic.
- `/work` adds a second income loop with custom shift messages and cooldown tracking.
- `/deposit` and `/withdraw` let members manage wallet versus bank storage.
- `/pay` transfers credits between members directly from wallet funds.
- `/shop`, `/buy`, `/inventory`, and `/use-item` provide a custom item economy loop.
- `/coinflip` and `/slots` add risk and reward gameplay with real wallet gains/losses.
- `/eco-add`, `/eco-remove`, and `/eco-set` allow staff to manage server economy balances.
- `/eco-config` allows server staff to tune daily/work and bet-limit settings per guild.
- `/shop-manage` allows server staff to create, update, disable, and list server-specific shop items.
- `/leaderboard` ranks the highest net worth profiles in the server.
- Shop items are database-backed per server, so each guild can run its own economy identity.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the root of the project using `.env.example` as a base.

```env
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CLIENT_ID=your-application-id
DISCORD_GUILD_ID=optional-guild-id-for-fast-command-deployment
MONGODB_URI=mongodb://127.0.0.1:27017/aegis-discord-bot (you can change with other ip)
DEFAULT_TICKET_CATEGORY_ID=discord-category-id-for-open-tickets
DEFAULT_TICKET_ARCHIVE_CATEGORY_ID=discord-category-id-for-archived-tickets
DEFAULT_LOG_CHANNEL_ID=discord-text-channel-id-for-mod-logs
ECONOMY_DAILY_AMOUNT=250
ECONOMY_DAILY_COOLDOWN_HOURS=24
ECONOMY_DAILY_STREAK_BONUS=40
ECONOMY_DAILY_RANDOM_BONUS_MAX=120
ECONOMY_WORK_MIN=120
ECONOMY_WORK_MAX=340
ECONOMY_WORK_COOLDOWN_MINUTES=90
```

### 3. Deploy slash commands

```bash
npm run deploy-commands
```

If `DISCORD_GUILD_ID` is set, commands are registered at guild scope for faster iteration. Otherwise, they are deployed globally.

The ticket and moderation routing now supports direct Discord IDs in environment variables, which is the recommended setup for stable test and production environments.

### 4. Start the bot

```bash
npm run start
```

For development:

```bash
npm run dev
```

## Recommended Discord Permissions

Enable these permissions for the bot role:

- View Channels
- Send Messages
- Manage Channels
- Manage Messages
- Moderate Members
- Ban Members
- Read Message History
- Embed Links
- Attach Files

## MongoDB Collections

- `guildconfigs`: guild-level settings and counters
- `userprofiles`: economy wallet, bank, streak, cooldown, and moderation profile data
- `moderationcases`: persistent moderation history
- `tickets`: ticket channel lifecycle data
- `shopitems`: server-specific economy item catalog

## Admin Economy Customization

- Use `/eco-config show` to review current guild economy settings.
- Use `/eco-config set` to tune rewards, cooldowns, and betting ranges.
- Use `/shop-manage list` to inspect all guild items.
- Use `/shop-manage upsert` to create or edit a shop item.
- Use `/shop-manage disable` to retire a shop item without deleting history.

## Quality Workflow

```bash
npm run lint
```

## Deployment Notes

- Use a process manager such as PM2 for production hosting.
- Keep `DISCORD_GUILD_ID` empty when promoting to global commands.
- Provision a managed MongoDB instance for public deployments.
- Review bot role hierarchy so moderation actions can be executed successfully.

## License

Distributed under the MIT License. See the [LICENSE](LICENSE) file for details.
