const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("copyrole")
        .setDescription("Duplicates a role including its permissions"),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        } else if(!args[0]) {
            msg.reply(`Correct usage: ${guildPrefix}copyrole <Name or ID of the role> <Name of the duplicated role> or ${guildPrefix}copyrole <Name or ID of the role>`);
            return;
        }
        let roleToCopy = utils.getRole(msg.member, args[0]);
        if (roleToCopy == null) {
            msg.reply("Warning! No role found.");
            return;
        }
        let roleName = `Kopie von ${roleToCopy.name}`;
        if(args[1]){
            roleName = args.slice(1).join(" ");
        }
        msg.guild.roles.create({
            name: roleName,
            color: roleToCopy.color,
            hoist: roleToCopy.hoist,
            permissions: roleToCopy.permissions,
            position: roleToCopy.position,
            mentionable: roleToCopy.mentionable,
            reason: "Role copied using the bot command"
        })
            .catch(console.error);
        msg.reply(`Successfully copied the role to **${roleName}**.`);
    },
};