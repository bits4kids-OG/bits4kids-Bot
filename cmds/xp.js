const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const xp_levels = require("../xp-and-levels.js");

const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp")
        .setDescription("Hiermit werden dir deine XP und dein Level angezeigt."),
    async execute(msg, args, client) {
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
            let member = msg.guild.members.cache.get(user.id);
            if(!member) member = await msg.guild.members.fetch(user.id).catch(console.error);
            if(member.roles && utils.checkIfTrainer(member.roles.cache) === true) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }
            msg.reply({ embeds: [xp_levels.xpInfoScreen(msg, user)] });
        } else {
            const author = msg.author;
            if(msg.member.roles && utils.checkIfTrainer(msg.member.roles.cache) === true) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }
            msg.reply({ embeds: [xp_levels.xpInfoScreen(msg, author)] });
        }
    },
};