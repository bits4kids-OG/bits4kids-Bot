const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const index = require("../index.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("refresh")
        .setDescription("Refreshes the bot's files and invite links of the server."),
    execute(msg) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) {
            msg.author.send("Das darfst du nicht machen!");
        } else {
            index.refresh(msg);
            msg.reply("Successfully refreshed the invites and files!");
        }
    },
};