const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const utils = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("refresh")
		.setDescription("Refreshes the bot's files and invite links of the server."),
	execute(msg) {
        if (!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)) {
            msg.author.send("Das darfst du nicht machen!");
          } else {
            utils.refresh(msg);
            msg.reply("Successfully refreshed the invites and files!");
          }
	},
};