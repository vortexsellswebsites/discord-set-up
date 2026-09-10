const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("guildCreate", async (guild) => {
  console.log(`Setting up ${guild.name}...`);

  // =========================
  // ROLES
  // =========================

  const roles = [
    { name: "Owner", color: 0xff0000 },
    { name: "Admin", color: 0xff7a00 },
    { name: "Moderator", color: 0x3498db },
    { name: "Member", color: 0x95a5a6 }
  ];

  for (const role of roles) {
    if (!guild.roles.cache.find(r => r.name === role.name)) {
      await guild.roles.create({
        name: role.name,
        color: role.color
      });
    }
  }

  // =========================
  // SERVER LAYOUT
  // =========================

  const categories = {
    "📌 IMPORTANT": [
      "👋・hello",
      "📜・rules",
      "📢・news",
      "✅・verify"
    ],

    "💬 COMMUNITY": [
      "💬・general",
      "🖼️・media",
      "🤖・commands"
    ],

    "⭐ KN × PROJECT": [
      "kn-x-ryven",
      "kn-x-starlight",
      "kn-x-kyro"
    ],

    "ℹ️ INFO": [
      "faq",
      "apk-available-servers"
    ],

    "🆘 HELP": [
      "public-support",
      "tickets",
      "support-application"
    ],

    "🛡️ STAFF": [
      "staff-hub",
      "🔒・staff-chat"
    ],

    "🎫 TICKETS": [
      "ticket-info"
    ],

    "📝 SUBMISSIONS": [
      "🔒・pending",
      "🔒・accepted"
    ]
  };

  // =========================
  // CREATE CATEGORIES + CHANNELS
  // =========================

  for (const [categoryName, channels] of Object.entries(categories)) {

    let category = guild.channels.cache.find(
      c =>
        c.name === categoryName &&
        c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory
      });
    }

    for (const channelName of channels) {

      let channel = guild.channels.cache.find(
        c => c.name === channelName
      );

      if (!channel) {
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id
        });
      }

      // =========================
      // RULES CHANNEL
      // =========================

      if (channelName === "📜・rules") {

        // Make rules read-only for @everyone
        await channel.permissionOverwrites.edit(
          guild.roles.everyone,
          {
            SendMessages: false,
            AddReactions: false
          }
        );

        // Let staff continue posting
        const staffRoles = ["Owner", "Admin", "Moderator"];

        for (const roleName of staffRoles) {
          const role = guild.roles.cache.find(
            r => r.name === roleName
          );

          if (role) {
            await channel.permissionOverwrites.edit(role, {
              SendMessages: true,
              AddReactions: true
            });
          }
        }

        // =========================
        // RULES MESSAGE
        // =========================

        const rulesEmbed = new EmbedBuilder()
          .setTitle("📜 SERVER RULES")
          .setDescription(
`**1. Be respectful**
No harassment, hate speech, or personal attacks.

**2. No spam**
Don't flood chats, mass mention, or abuse commands.

**3. No NSFW content**
Keep the server appropriate.

**4. No advertising**
Don't advertise other servers, services, or accounts without permission.

**5. No scams or malicious content**
No phishing, malware, fraud, or suspicious links.

**6. Follow Discord's rules**
You must follow Discord's Terms of Service and Community Guidelines.

**7. Listen to staff**
Staff decisions should be respected. If you disagree, contact an administrator privately.

**⚠️ Breaking the rules can result in a warning, timeout, kick, or ban.**`
          )
          .setFooter({
            text: "Please follow the rules and enjoy the server!"
          })
          .setTimestamp();

        await channel.send({
          embeds: [rulesEmbed]
        });
      }
    }
  }

  console.log(`${guild.name} setup complete!`);
});

client.login(process.env.DISCORD_TOKEN);