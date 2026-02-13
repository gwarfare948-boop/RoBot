const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });


mongoose.connect(process.env.MONGO);

const User = mongoose.model("users", new mongoose.Schema({
  discord: String,
  roblox: String,
  username: String
}));

client.once("ready", async () => {
  console.log("ONLINE");

  const verify = new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify Roblox account")
    .addStringOption(o => o.setName("username").setDescription("Roblox username").setRequired(true));

  await client.application.commands.set([verify]);
});

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  const name = i.options.getString("username");
  const code = Math.random().toString(36).slice(2, 8);

  await User.findOneAndUpdate(
    { discord: i.user.id },
    { discord: i.user.id, username: name, roblox: code },
    { upsert: true }
  );

  await i.reply(`Put this in your Roblox bio:\n**${code}**\nThen run /verify again.`);
});

// Login with environment variable
client.login(process.env.TOKEN);
