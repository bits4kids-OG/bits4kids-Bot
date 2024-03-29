const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const xp_levels = require("../xp-and-levels.js");

const config = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp")
        .setDescription("Hiermit werden dir deine XP und dein Level angezeigt."),
    execute(msg, args, client) {
        if(args[0] && msg.mentions.users.first()) {
            if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
                msg.author.send("Das darfst du nicht machen!");
                return;
            }
            const user = msg.mentions.users.first();
            if (user.id === client.user.id) {
                msg.reply("The bot can't have xp!");
                return;
            }
            const normalTrainRole = msg.guild.roles.cache.find(r => r.id === config.TrainerRolle);
            const trainRole = msg.guild.roles.cache.find(r => r.id === config.OnlineTrainerRolle);
            const orgRole = msg.guild.roles.cache.find(r => r.id === config.OrganisationRolle);
            const member = msg.guild.members.cache.get(user.id);
            if ((normalTrainRole) && (trainRole) && (orgRole) && (member.roles) && ((member.roles.cache.has(normalTrainRole.id)) || (member.roles.cache.has(trainRole.id)) || (member.roles.cache.has(orgRole.id)))) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }
            msg.reply({ embeds: [xp_levels.xpInfoScreen(msg, user)] });
        } else {
            const author = msg.author;
            const normalTrainRole = msg.guild.roles.cache.find(r => r.id === config.TrainerRolle);
            const trainRole = msg.guild.roles.cache.find(r => r.id === config.OnlineTrainerRolle);
            const orgRole = msg.guild.roles.cache.find(r => r.id === config.OrganisationRolle);
            if ((normalTrainRole) && (trainRole) && (orgRole) && (msg.member.roles) && ((msg.member.roles.cache.has(normalTrainRole.id)) || (msg.member.roles.cache.has(trainRole.id)) || (msg.member.roles.cache.has(orgRole.id)))) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }
            msg.reply({ embeds: [xp_levels.xpInfoScreen(msg, author)] });
        }
    },
};