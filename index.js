/**
 * CS2 Stats Discord Bot
 *
 * A Discord bot that fetches and displays Counter-Strike 2 statistics for Steam profiles.
 * The bot supports various Steam URL formats and provides detailed statistics including
 * combat performance, match history, weapon usage, and map wins.
 *
 * Requirements:
 * - Discord.js
 * - A valid Steam API key
 * - A Discord bot token
 * - Public Steam profiles only
 *
 * Commands:
 * !cs2stats <steam_profile> - Display CS2 statistics for the given Steam profile
 * !help or !commands - Display help information
 *
 * @author Caleb Ruhm
 * @version 1.0.0
 */

const { Client, IntentsBitField, EmbedBuilder } = require("discord.js");
const { token, steamApiKey } = require("./config.json");
const https = require("https");

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/**
 * Makes an HTTPS GET request and returns a Promise with the parsed JSON response
 * @param {string} url - The URL to make the GET request to
 * @returns {Promise<any>} A promise that resolves with the parsed JSON data
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (resp) => {
        let data = "";
        resp.on("data", (chunk) => {
          data += chunk;
        });
        resp.on("end", () => resolve(JSON.parse(data)));
      })
      .on("error", reject);
  });
}

/**
 * Extracts a Steam64 ID from various Steam profile URL formats
 * @param {string} input - Steam profile URL or Steam64 ID
 * @returns {string|null} Returns the Steam64 ID if found, null otherwise
 *
 * Supported formats:
 * - Raw Steam64 ID (17 digits)
 * - Profile URLs: steamcommunity.com/profiles/[Steam64 ID]
 * - Custom URLs: steamcommunity.com/id/[CustomURL]
 */
function extractSteamId(input) {
  // If it's already a Steam64 ID (just numbers)
  if (/^\d{17}$/.test(input)) {
    return input;
  }

  // Handle various Steam URL formats
  const urlPatterns = [
    /steamcommunity\.com\/profiles\/(\d{17})/, // Profile URLs
    /steamcommunity\.com\/id\/([^\/]+)/, // Custom URLs
    /steamcommunity\.com\/profiles\/(\d{17})/, // Profile URLs with trailing slash
    /steamcommunity\.com\/id\/([^\/]+)\//, // Custom URLs with trailing slash
  ];

  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match) {
      // If it's a direct Steam64 ID URL
      if (match[1] && /^\d{17}$/.test(match[1])) {
        return match[1];
      }
      // If it's a custom URL, we need to inform the user
      return null;
    }
  }

  return null;
}

client.on("messageCreate", async (message) => {
  /**
   * Ignore messages from other bots to prevent potential bot-loops
   * This is a security measure to ensure the bot only responds to human users
   * and doesn't get caught in an infinite loop with other bots
   */
  if (message.author.bot) return;

  /**
   * Handles the help command (!help or !commands)
   * Creates and sends an embedded message with bot usage instructions
   *
   * @param {Message} message - The Discord message object
   * @returns {Promise<Message>} The sent reply message
   */
  if (
    message.content.toLowerCase() === "!help" ||
    message.content.toLowerCase() === "!commands"
  ) {
    const helpEmbed = new EmbedBuilder()
      .setTitle("CS2 Stats Bot Commands")
      .setColor("#0099ff")
      .addFields(
        {
          name: "!cs2stats <steam_profile>",
          value:
            "Shows CS2 statistics for the given Steam profile\n" +
            "Accepts:\n" +
            "• Steam64 ID: `!cs2stats 76561198012345678`\n" +
            "• Profile URL: `!cs2stats steamcommunity.com/profiles/76561198012345678`",
        },
        {
          name: "How to find Steam profile URL",
          value:
            "1. Go to your Steam profile\n2. Copy the URL from your browser\n3. Paste it after the command",
        },
        {
          name: "Requirements",
          value:
            "• Steam profile must be public\n• Steam game details must be public\n• Must have played CS2",
        }
      )
      .setFooter({ text: "For more help, well idk that sucks" });

    return message.reply({ embeds: [helpEmbed] });
  }

  /**
   * Handles the CS2 stats command (!cs2stats)
   * Checks if a message begins with "!cs2stats" to trigger the stats lookup functionality
   *
   * Command format: !cs2stats <steam_profile>
   * Example: !cs2stats steamcommunity.com/profiles/76561198012345678
   *
   * This is the main command handler that:
   * 1. Validates the command syntax
   * 2. Extracts the Steam profile information
   * 3. Fetches stats from Steam API
   * 4. Formats and displays the results
   */
  if (message.content.startsWith("!cs2stats")) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      return message.reply(
        "Please provide a Steam profile URL or ID64. Usage: !cs2stats <url/id>"
      );
    }

    const input = args.slice(1).join(" ").trim(); // Join all arguments after command
    const steamId = extractSteamId(input);

    if (!steamId) {
      return message.reply(
        "Invalid Steam URL or ID. Please provide either:\n" +
          "• A Steam64 ID (17 digits)\n" +
          "• A Steam profile URL (steamcommunity.com/profiles/...)\n" +
          "• For custom URLs (steamcommunity.com/id/...), please convert to Steam64 ID first using steamid.io"
      );
    }

    try {
      // Use httpsGet instead of fetch
      const statsData = await httpsGet(
        `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?appid=730&key=${steamApiKey}&steamid=${steamId}`
      );
      const summaryData = await httpsGet(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamId}`
      );

      const userSummary = summaryData.response.players[0];
      const stats = statsData.playerstats.stats;

      /**
       * Helper function to find a specific stat from the Steam stats array
       * @param {Array} stats - Array of Steam stats
       * @param {string} name - Name of the stat to find
       * @returns {number} Value of the stat or 0 if not found
       */
      const findStat = (name) => {
        const stat = stats.find((s) => s.name === name);
        return stat ? stat.value : 0;
      };

      /**
       * Helper function to format numbers with commas
       * @param {number} num - Number to format
       * @returns {string} Formatted number with commas
       */
      const formatNumber = (num) =>
        num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      /**
       * Formats playtime from seconds into a readable string
       * @param {number} seconds - Time in seconds
       * @returns {string} Formatted time string (e.g., "5d 12h" or "23h")
       */
      const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        if (days > 0) {
          return `${days}d ${remainingHours}h`;
        }
        return `${hours}h`;
      };

      // General statistics
      const generalStats = {
        timePlayed: findStat("total_time_played"),
        bombsPlanted: findStat("total_planted_bombs"),
        bombsDefused: findStat("total_defused_bombs"),
        damageDone: findStat("total_damage_done"),
        moneyEarned: findStat("total_money_earned"),
      };

      // Combat statistics
      const combatStats = {
        kills: findStat("total_kills"),
        deaths: findStat("total_deaths"),
        headshots: findStat("total_kills_headshot"),
        accuracy: (
          (findStat("total_shots_hit") / findStat("total_shots_fired")) *
          100
        ).toFixed(1),
        kdRatio: (findStat("total_kills") / findStat("total_deaths")).toFixed(
          2
        ),
      };

      // Match statistics
      const matchStats = {
        matchesWon: findStat("total_matches_won"),
        matchesPlayed: findStat("total_matches_played"),
        winRate: (
          (findStat("total_matches_won") / findStat("total_matches_played")) *
          100
        ).toFixed(1),
        mvps: findStat("total_mvps"),
      };

      // Weapon statistics
      const weaponStats = {
        shotsHit: findStat("total_shots_hit"),
        shotsFired: findStat("total_shots_fired"),
        knifeKills: findStat("total_kills_knife"),
        grenadeKills: findStat("total_kills_hegrenade"),
      };

      const weaponStats2 = {
        ak: findStat("total_kills_ak47"),
        m4a1s: findStat("total_kills_m4a1"),
        awp: findStat("total_kills_awp"),
        glock: findStat("total_kills_glock"),
        usps: findStat("total_kills_hkp2000"),
      };

      // Map statistics
      const mapStats = {
        dust2: findStat("total_wins_map_de_dust2"),
        inferno: findStat("total_wins_map_de_inferno"),
        nuke: findStat("total_wins_map_de_nuke"),
        vertigo: findStat("total_wins_map_de_vertigo"),
        train: findStat("total_wins_map_de_train"),
      };

      const statsEmbed = new EmbedBuilder()
        .setTitle(`CS2 Stats for ${userSummary.personaname}`)
        .setThumbnail(userSummary.avatarmedium)
        .setColor("#0099ff")
        .addFields(
          // General Stats
          {
            name: "⏱️ General",
            value:
              `Time Played: **${formatTime(generalStats.timePlayed)}**\n` +
              `Bombs Planted: **${formatNumber(
                generalStats.bombsPlanted
              )}**\n` +
              `Bombs Defused: **${formatNumber(
                generalStats.bombsDefused
              )}**\n` +
              `Damage Done: **${formatNumber(generalStats.damageDone)}**\n` +
              `Money Earned: **$${formatNumber(generalStats.moneyEarned)}**`,
            inline: true,
          },
          // Combat Stats
          {
            name: "🎯 Combat Stats",
            value:
              `Kills: **${formatNumber(combatStats.kills)}**\n` +
              `Deaths: **${formatNumber(combatStats.deaths)}**\n` +
              `K/D Ratio: **${combatStats.kdRatio}**\n` +
              `Accuracy: **${combatStats.accuracy}%**\n` +
              `Headshot Kills: **${formatNumber(combatStats.headshots)}**`,
            inline: true,
          },
          // Match Stats
          {
            name: "🏆 Match Stats",
            value:
              `Matches Played: **${formatNumber(
                matchStats.matchesPlayed
              )}**\n` +
              `Matches Won: **${formatNumber(matchStats.matchesWon)}**\n` +
              `Win Rate: **${matchStats.winRate}%**\n` +
              `MVP Stars: **${formatNumber(matchStats.mvps)}**`,
            inline: true,
          },
          // Weapon Stats
          {
            name: "💣 Weapon Stats",
            value:
              `Shots Fired: **${formatNumber(weaponStats.shotsFired)}**\n` +
              `Shots Hit: **${formatNumber(weaponStats.shotsHit)}**\n` +
              `Knife Kills: **${formatNumber(weaponStats.knifeKills)}**\n` +
              `Grenade Kills: **${formatNumber(weaponStats.grenadeKills)}**`,
            inline: true,
          },
          // Weapon Stats
          {
            name: "🔫 Popular Weapons",
            value:
              `AK-47 Kills: **${formatNumber(weaponStats2.ak)}**\n` +
              `M4A1-S Kills: **${formatNumber(weaponStats2.m4a1s)}**\n` +
              `AWP Kills: **${formatNumber(weaponStats2.awp)}**\n` +
              `Glock-18 Kills: **${formatNumber(weaponStats2.glock)}**\n` +
              `USP-S Kills: **${formatNumber(weaponStats2.usps)}**`,
            inline: true,
          },
          // Map Stats
          {
            name: "🗺️ Map Wins",
            value:
              `Dust II: **${formatNumber(mapStats.dust2)}**\n` +
              `Inferno: **${formatNumber(mapStats.inferno)}**\n` +
              `Nuke: **${formatNumber(mapStats.nuke)}**\n` +
              `Vertigo: **${formatNumber(mapStats.vertigo)}**\n` +
              `Train: **${formatNumber(mapStats.train)}**`,
            inline: true,
          }
        )
        .setTimestamp();

      message.reply({ embeds: [statsEmbed] });
    } catch (error) {
      console.error("Error fetching Steam stats:", error);
      message.reply(
        "Error fetching stats. Make sure the profile is public, game details are public, and the Steam ID is correct."
      );
    }
  }
});

client.login(token);
