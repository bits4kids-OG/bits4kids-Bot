const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const prefix = require("discord-prefix");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("changeprefix")
        .setDescription("Changes the prefix for this server."),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)) {
            msg.author.send("Das darfst du nicht machen!");
        }
        else if (!args[0] || args[0] === "help") {
            msg.reply(`Correct usage: ${guildPrefix}changeprefix <desired prefix>`);
        }
        else if (args[0].length >= 3) {
            msg.reply("Your prefix can't be longer than 3 characters!");
        }
        else {
            prefix.setPrefix(args[0], msg.guild.id);
            guildPrefix = prefix.getPrefix(msg.guild.id);
            msg.reply(`Prefix changed to ${guildPrefix}`);
        }
    },
};