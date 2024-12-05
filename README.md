## About

A Discord bot that fetches and displays Counter-Strike 2 statistics for Steam profiles.
The bot supports various Steam URL formats and provides detailed statistics including combat performance, match history, weapon usage, and map wins.

## Requirements

- [Node.js v22+](https://nodejs.org/en)
- [Discord.js v14+](https://discord.js.org/)
- Discord Token. Get it from [Discord Developers Portal](https://discord.com/developers/applications)
- Steam API Key. Get it from [Steam Web API](https://steamcommunity.com/dev/apikey)

## 🛠️ Setup Instructions

#### Clone the repo by running

```bash
git clone https://github.com/CalebRuhm/cs2_stats_discord_bot.git
```

#### Navigate to cs2_stats_discord_bot/

```bash
cd cs2_stats_discord_bot/
```

#### Install dependencies

```bash
npm install
```

#### To start your bot (Don't run untill tokens have been added to config.json or bot will fail, see steps below)

```js
node index.js
```

## 🤖 Discord Bot Setup

- Go to the [Discord Developer Portal](https://discord.com/developers/applications)
- Click "**New Application**" and give your application a name
- Go to the "**Bot**" tab and give you bot a name (if you want)
- Go to the "**OAuth2**" tab
- Under "**OAuth2 URL Generator**", select "bot"
- Under "**Bot Permissions**", select the permissions your bot needs (at minimum: Read Messages/View Channels, Send Messages)
- Copy the generated OAuth2 URL and use it to invite the bot to your server

## 🔑 Discord Token Setup

- Go back to [Discord Developer Portal](https://discord.com/developers/applications)
- Go to the "**Bot**" tab
- Click "**Reset Token**" and copy the new token
- Paste token into `config.json` where it says `"DISCORD_TOKEN"`

## 🎮 Steam API Key Setup

- Go to the [Steam Web API](https://steamcommunity.com/dev/apikey)
- Enter a domain name for your application (Just enter "`localhost`" or "`DiscordBot`" for now)
- Confirm on mobile device if you have one
- Copy the key and paste it into `config.json` where it says `"STEAM_API_KEY"`

## 🎯 Steam ID

#### Find your Steam ID :

- Open your Steam profile
- Right-click anywhere on the page and select "Copy Page URL"
- Your Steam ID is the number at the end of the URL
- Example: In `https://steamcommunity.com/profiles/76561198012345678`, the Steam ID is `76561198012345678`

#### Alternative method :

- If you have a custom URL (like `https://steamcommunity.com/id/username`)
- Visit [SteamID.io](https://steamid.io/) and enter your profile URL
- Copy your Steam64 ID (also called Steam ID)

## 💬 Bot Commands

- `!help` - Bot help / information
- `!commands` - View bot commands
- `!cs2stats <steam_id>` - View CS2 stats for a given Steam ID (can also use Steam profile URL)
- `!cs2stats 76561198012345678` - Example command

## ❗ Troubleshooting

- If you're having trouble with the bot, make sure it has permission to send messages in the channel it's in
- To view a users stats, their steam profile must be [visible](https://help.steampowered.com/en/faqs/view/588C-C67D-0251-C276) and their game details must be [public](https://help.steampowered.com/en/faqs/view/1150-C06F-4D62-4966)
- If you're still having trouble, feel free to reach out to me on [Discord](https://support.discord.com/hc/en-us/articles/218344397-How-do-I-add-friends-on-Discord#h_01J0KH7RTG27DP54JNAYPH0R1S): `@hehehehehehelp`

<!-- ABOUT THE PROJECT -->

> You may not claim this as your own! The original source was created by [Caleb Ruhm](https://github.com/CalebRuhm)

> If you like this repository, feel free to leave a star ⭐ to motivate me!

> Note, this bot will run so long as your local machine is running the script. If you want this bot to work 24/7, youll have to setup / run on a server.
