const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinvite")
        .setDescription("Hier erhält man einen Invite Link für den Server."),
    execute(msg) {
        if (msg.guild && msg.member.permissions.has(Discord.PermissionsBitField.Flags.CreateInstantInvite)) {
            utils.serverInvite(msg);
            msg.reply("Sent you a DM!");
        } else {
            msg.reply("Sorry, but you don't have the permission to do that.");
        }
    },
};