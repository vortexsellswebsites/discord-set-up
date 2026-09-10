const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Sets up the server and posts the rules.");

async function setupServer(guild) {
  // Roles
  const roles = [
    { name: "Owner", color: 0xff0000 },
    { name: "Admin", color: 0xff7a00 },
    { name: "Moderator", color: 0x3498db },
    { name: "Member", color: 0x95a5a6 }
  ];

  for (const role of roles) {
    if (!guild.roles.cache.some(r => r.name === role.name)) {
      await guild.roles.create({
        name: role.name,
        color: role.color
      });
    }
  }

  // Categories and channels
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

  let rulesChannel;

  for (const [categoryName, channels] of Object.entries(categories)) {
    let category = guild.channels.cache.find(
      c =>
        c.type === ChannelType.GuildCategory &&
        c.name === categoryName
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

      if (channelName === "📜・rules") {
        rulesChannel = channel;
      }
    }
  }

  // Rules channel permissions
  if (rulesChannel) {
    await rulesChannel.permissionOverwrites.edit(
      guild.roles.everyone,
      {
        SendMessages: false,
        AddReactions: false
      }
    );

    // Exact rules
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

**⚠️ Breaking the rules can result in a warning, timeout, kick, or ban.`
      )
      .setFooter({
        text: "Please follow the rules and enjoy the server!"
      })
      .setTimestamp();

    await rulesChannel.send({
      embeds: [rulesEmbed]
    });
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register /setup command
  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: [setupCommand.toJSON()]
      }
    );

    console.log("Registered /setup command.");
  } catch (error) {
    console.error(error);
  }
});

// /setup command
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "setup") return;

  if (!interaction.memberPermissions.has(
    PermissionFlagsBits.Administrator
  )) {
    return interaction.reply({
      content: "❌ You need Administrator permission to use this command.",
      ephemeral: true
    });
  }

  await interaction.reply("⚙️ Setting up the server...");

  try {
    await setupServer(interaction.guild);

    await interaction.editReply(
      "✅ Server setup complete! Check the `📜・rules` channel."
    );
  } catch (error) {
    console.error(error);

    await interaction.editReply(
      "❌ Something went wrong while setting up the server."
    );
  }
});

// Automatically setup when the bot joins a NEW server
client.on("guildCreate", async guild => {
  try {
    await setupServer(guild);
    console.log(`Automatically set up ${guild.name}`);
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.DISCORD_TOKEN);