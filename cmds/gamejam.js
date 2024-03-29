const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");
const config = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gamejam")
        .setDescription("Used for allowing users to see the GameJam Channel.")
        .setDefaultPermission(false),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        if (!args[0]) {
            msg.reply(`Correct usage: ${guildPrefix}gamejam start or ${guildPrefix}gamejam stop or ${guildPrefix}gamejam status.`);
            return;
        }
        const gamejamChannel = findGamejamChannel(msg,config.GameJamChannel);
        if(!gamejamChannel) return;

        if (args[0] === "start") {
            gamejamChannel.permissionOverwrites.edit(msg.guild.roles.everyone, { ViewChannel: null });
            msg.reply("GameJam Channels are now visible to everyone.");
            return;
        }

        if (args[0] === "stop") {
            gamejamChannel.permissionOverwrites.edit(msg.guild.roles.everyone, { ViewChannel: false });
            msg.reply("GameJam Channels are now hidden for everyone.");
            return;
        }

        if (args[0] === "status") {
            if (gamejamChannel.permissionsFor(msg.guild.roles.everyone).has(Discord.PermissionsBitField.Flags.ViewChannel)) {
                msg.reply("GameJam Channels are currently visible to everyone.");
            } else {
                msg.reply("GameJam Channels are currently hidden for everyone.");
            }
            return;
        }
        msg.reply(`Correct usage: ${guildPrefix}gamejam start or ${guildPrefix}gamejam stop or ${guildPrefix}gamejam status.`);
        return;


        function findGamejamChannel(msg, id) {
            let channel = msg.guild.channels.cache.get(id);
            if ((channel) && (((channel.permissionsFor(msg.guild.members.me).has(Discord.PermissionsBitField.Flags.ViewChannel)) == false) || ((channel.permissionsFor(msg.guild.members.me).has(Discord.PermissionsBitField.Flags.ManageRoles)) == false))) {
                channel = null;
                const sonstchannel = utils.findLogChannel(msg.guild);
                if (sonstchannel) {
                    sonstchannel.send("I don't have the permission to edit the permissions of the GameJam channel!");
                }
            }
            if (!channel) {
                const sonstchannel = utils.findLogChannel(msg.guild);
                if (sonstchannel) {
                    sonstchannel.send("GameJam channel not found!");
                }
            }
            return channel;
        }
    },
};