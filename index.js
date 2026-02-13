const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// MongoDB connection
mongoose.connect(process.env.MONGO)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("MongoDB connection error ❌", err));

// User schema
const User = mongoose.model("users", new mongoose.Schema({
  discordId: { type: String, required: true },
  robloxUsername: { type: String, required: true },
  verificationCode: { type: String, required: true },
  verified: { type: Boolean, default: false }
}));

// When bot is ready
client.once("ready", async () => {
  console.log(`Bot is ONLINE as ${client.user.tag}`);

  // Slash command: /verify <username>
  const verifyCommand = new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify your Roblox account")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Your Roblox username")
        .setRequired(true)
    );

  await client.application.commands.set([verifyCommand]);
});

// Handle interactions
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const username = interaction.options.getString("username");
  
  // Generate a 6-character code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Store or update user in DB
  await User.findOneAndUpdate(
    { discordId: interaction.user.id },
    {
      discordId: interaction.user.id,
      robloxUsername: username,
      verificationCode: code,
      verified: false
    },
    { upsert: true }
  );

  // Reply with ephemeral message (only user sees it)
  await interaction.reply({
    content: `✅ Your verification code is: **${code}**\n\nPut this code in your Roblox **bio** or somewhere in your profile.\nAfter that, run /verify again to complete verification.`,
    ephemeral: true
  });
});

// Bot login
client.login(process.env.TOKEN);
