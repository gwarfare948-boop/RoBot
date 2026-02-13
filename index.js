const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGO)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("MongoDB connection error ❌", err));

// Define User schema
const User = mongoose.model("users", new mongoose.Schema({
  discord: String,
  roblox: String,
  username: String
}));

// Ready event
client.once("ready", async () => {
  console.log(`Bot is ONLINE as ${client.user.tag}`);

  // Register slash command
  const verify = new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify Roblox account")
    .addStringOption(o => o
      .setName("username")
      .setDescription("Your Roblox username")
      .setRequired(true)
    );

  await client.application.commands.set([verify]);
});

// Interaction event
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const username = interaction.options.getString("username");
  const code = Math.random().toString(36).slice(2, 8); // generate verification code

  await User.findOneAndUpdate(
    { discord: interaction.user.id },
    { discord: interaction.user.id, username: username, roblox: code },
    { upsert: true }
  );

  await interaction.reply(`Put this in your Roblox bio:\n**${code}**\nThen run /verify again.`);
});

// Login with Discord token from environment variable
client.login(process.env.TOKEN);
