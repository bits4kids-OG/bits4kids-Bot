const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const beginnerPurge = require("../beginnerPurge.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("purgebeginners")
        .setDescription("Checkt/Updated den Beginner Status aller Beginner.")
        .setDefaultPermission(false),
    async execute(msg) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }

        const beginnerCounter = await beginnerPurge.purgeBeginners(msg);

        if(beginnerCounter) {
            msg.reply(`Audited ${beginnerCounter.audited} users and purged ${beginnerCounter.purged} beginners!`);
        } else {
            msg.reply("No beginner purge possible on this guild.");
        }

        return;
    },
};