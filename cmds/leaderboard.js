const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const leaderboard = require("../leaderboard.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Creates/Updates the leaderboard.")
        .setDefaultPermission(false),
    async execute(msg, args, client) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }

        msg.reply("🏆 Leaderboard wird generiert ...");

        await leaderboard.createLeaderboard(client);
        msg.reply("🏆 Leaderboard wurde aktualisiert!");
    
    },
};
