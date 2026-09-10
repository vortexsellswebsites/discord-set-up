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

const SERVER_ID = "1539348072188874762";

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Automatically sets up the server.");

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


// ==========================================
// CREATE ROLES
// ==========================================

async function createRoles(guild) {
  const roles = [
    {
      name: "Owner",
      color: 0xff0000
    },
    {
      name: "Admin",
      color: 0xff7a00
    },
    {
      name: "Moderator",
      color: 0x3498db
    },
    {
      name: "Member",
      color: 0x95a5a6
    }
  ];

  for (const roleInfo of roles) {
    const existingRole = guild.roles.cache.find(
      role => role.name === roleInfo.name
    );

    if (!existingRole) {
      await guild.roles.create({
        name: roleInfo.name,
        color: roleInfo.color,
        reason: "Automatic server setup"
      });
    }
  }
}


// ==========================================
// CREATE CHANNELS
// ==========================================

async function createChannels(guild) {

  let rulesChannel = null;

  for (const [categoryName, channelNames] of Object.entries(categories)) {

    let category = guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === categoryName
    );

    if (!category) {
      category = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        reason: "Automatic server setup"
      });
    }

    for (const channelName of channelNames) {

      let channel = guild.channels.cache.find(
        channel =>
          channel.type === ChannelType.GuildText &&
          channel.name === channelName
      );

      if (!channel) {
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: "Automatic server setup"
        });
      }

      if (channelName === "📜・rules") {
        rulesChannel = channel;
      }
    }
  }

  return rulesChannel;
}


// ==========================================
// RULES
// ==========================================

async function setupRules(guild, rulesChannel) {

  if (!rulesChannel) return;

  // Members cannot send messages in rules
  await rulesChannel.permissionOverwrites.edit(
    guild.roles.everyone,
    {
      SendMessages: false,
      AddReactions: false
    }
  );

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

  // Prevent duplicate rules messages
  const messages = await rulesChannel.messages.fetch({
    limit: 50
  });

  const alreadyPosted = messages.some(
    message =>
      message.author.id === client.user.id &&
      message.embeds.length > 0 &&
      message.embeds[0].title === "📜 SERVER RULES"
  );

  if (!alreadyPosted) {
    await rulesChannel.send({
      embeds: [rulesEmbed]
    });
  }
}


// ==========================================
// FULL SERVER SETUP
// ==========================================

async function setupServer(guild) {

  console.log(`Starting setup for ${guild.name}...`);

  await createRoles(guild);

  const rulesChannel = await createChannels(guild);

  await setupRules(guild, rulesChannel);

  console.log(`Setup complete for ${guild.name}.`);
}


// ==========================================
// BOT READY
// ==========================================

client.once("ready", async () => {

  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({
    version: "10"
  }).setToken(process.env.DISCORD_TOKEN);

  try {

    await rest.put(
      Routes.applicationGuildCommands(
        client.user.id,
        SERVER_ID
      ),
      {
        body: [setupCommand.toJSON()]
      }
    );

    console.log("✅ /setup registered successfully.");

  } catch (error) {

    console.error("❌ Failed to register /setup:");
    console.error(error);
  }
});


// ==========================================
// /SETUP COMMAND
// ==========================================

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== "setup") return;

  if (!interaction.guild) {
    return interaction.reply({
      content: "❌ This command can only be used inside a server.",
      ephemeral: true
    });
  }

  if (
    !interaction.memberPermissions.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return interaction.reply({
      content: "❌ You need Administrator permission to use `/setup`.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content: "⚙️ Setting up the server..."
  });

  try {

    await setupServer(interaction.guild);

    await interaction.editReply(
      "✅ **Setup complete!** Check the categories and `📜・rules` channel."
    );

  } catch (error) {

    console.error(error);

    await interaction.editReply(
      "❌ Something went wrong. Check the Railway logs."
    );
  }
});


// ==========================================
// AUTOMATIC SETUP WHEN BOT JOINS
// ==========================================

client.on("guildCreate", async guild => {

  console.log(`Bot joined ${guild.name}.`);

  try {

    await setupServer(guild);

  } catch (error) {

    console.error(
      `❌ Automatic setup failed for ${guild.name}:`
    );

    console.error(error);
  }
});


// ==========================================
// LOGIN
// ==========================================

client.login(process.env.DISCORD_TOKEN);