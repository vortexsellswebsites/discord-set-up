const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("guildCreate", async (guild) => {
  console.log(`Setting up ${guild.name}...`);

  // Roles
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

  // Server layout
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

  for (const [categoryName, channels] of Object.entries(categories)) {
    let category = guild.channels.cache.find(
      c => c.name === categoryName && c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory
      });
    }

    for (const channelName of channels) {
      if (!guild.channels.cache.find(c => c.name === channelName)) {
        await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id
        });
      }
    }
  }

  console.log(`${guild.name} setup complete!`);
});

client.login(process.env.DISCORD_TOKEN);