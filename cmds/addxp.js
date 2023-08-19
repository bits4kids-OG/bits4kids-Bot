const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const xp_levels = require("../xp-and-levels.js");
const config = require("../config.json");

const numberCodeReg = /^-?[1-9]\d*$/;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addxp")
        .setDescription("Adds XP to a user.")
        .setDefaultPermission(false),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        if(!args[0] || !args[1] || isNaN(args[1]) || !msg.mentions.users.first()) {
            msg.reply(`Correct usage: ${guildPrefix}addxp <@user> <amount of xp>`);
            return;
        } else if ((isInDesiredForm(args[1]) === false) || (testNumber(args[1]) == null) || (testNumber(args[1]) > 5000) || (testNumber(args[1]) < -1000)) {
            msg.reply(`Invalid amount of xp!\n*For testing with high xp amounts please use ${guildPrefix}setlevel instead.*`);
            return;
        } else {
            const user = msg.mentions.users.first();
            const number = testNumber(args[1]);
            if ((user.id === client.user.id) || (user.bot)) {
                msg.reply("You can't give the bot xp!");
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

            if(number > 0) {
                xp_levels.addXP(msg, user, number, guildPrefix);
                msg.reply(`${number} xp wurden ${user} hinzugefügt!`);
            } else if(number < 0) {
                xp_levels.removeXP(msg, user, number, guildPrefix);
                msg.reply(`${Math.abs(number)} xp wurden ${user} abgezogen!`);
            }
        }

        function isInDesiredForm(str) {
            var n = Math.floor(Number(str));
            return n !== Infinity && String(n) === str && n !== 0;
        }

        function testNumber(number) {
            if (!numberCodeReg.test(Number(number))) return null;
            return Number(number);
        }

    },
};