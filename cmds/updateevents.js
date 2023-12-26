const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const driveAutoEvents = require("../driveAutoEvents.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("updateevents")
        .setDescription("Creates/Updates Discord events using the Google Drive API.")
        .setDefaultPermission(false),
    async execute(msg, args, client) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }

        await driveAutoEvents.createEvents(client);
    
    },
};