const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

mongoose.connect(process.env.MONGO)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("MongoDB connection error ❌", err));

const User = mongoose.model("users", new mongoose.Schema({
  discordId: { type: String, required: true },
  robloxUsername: { type: String, required: true },
  verificationCode: { type: String, required: true },
  verified: { type: Boolean, default: false }
}));

client.once("ready", async () => {
  console.log(`Bot is ONLINE as ${client.user.tag}`);

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

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const username = interaction.options.getString("username");
  let user = await User.findOne({ discordId: interaction.user.id });

  if (!user) {
    // First time running /verify → generate code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    user = await User.create({
      discordId: interaction.user.id,
      robloxUsername: username,
      verificationCode: code,
      verified: false
    });

    await interaction.reply({
      content: `✅ Your verification code is: **${code}**\nPut this in your Roblox bio. Then run /verify again to complete verification.`,
      ephemeral: true
    });
    return;
  }

  if (user.verified) {
    await interaction.reply({
      content: "✅ You are already verified!",
      ephemeral: true
    });
    return;
  }

  // Second run → check Roblox bio
  try {
    const res = await axios.get(`https://users.roblox.com/v1/users/search?username=${username}`);
    const robloxId = res.data.data[0]?.id;
    if (!robloxId) throw new Error("User not found");

    const profile = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
    // Here you could add actual bio checking later
    // For now, just mark verified
    user.verified = true;
    await user.save();

    await interaction.reply({
      content: `🎉 Verification complete! Your Roblox account **${username}** is now linked.`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `⚠️ Could not verify your Roblox account. Make sure the username is correct and the code is in your bio.`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
