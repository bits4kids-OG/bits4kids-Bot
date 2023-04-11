const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const xp_levels = require("../xp-and-levels.js");
const config = require("../config.json");
const utils = require('../utils.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName("addxp")
		.setDescription("Adds XP to a user.")
        .setDefaultPermission(false),
	execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        if(!args[0] || !args[1] || isNaN(args[1]) || !msg.mentions.users.first()) {
            msg.reply(`Correct usage: ${guildPrefix}addxp <@user> <amount of xp>`);
            return;
        } else if ((utils.isInDesiredForm(args[1]) === false) || (utils.testNumber(args[1]) == null)) {
            msg.reply("Invalid amount of xp!")
        } else {
            const user = msg.mentions.users.first();
            const number = utils.testNumber(args[1]);
            if ((user.id === client.user.id) || (user.bot)) {
                msg.reply("You can't give the bot xp!");
                return;
            }
            const trainRole = msg.guild.roles.cache.find(r => r.id === config.TrainerRolle);
            const orgRole = msg.guild.roles.cache.find(r => r.id === config.OrganisationRolle);
            const member = msg.guild.members.cache.get(user.id);
            if ((trainRole) && (orgRole) && (member.roles) && ((member.roles.cache.has(trainRole.id)) || (member.roles.cache.has(orgRole.id)))) {
              msg.reply("Error: Trainer:innen können keine XP besitzen.");
              return;
            }

            xp_levels.addXP(msg, user, number, guildPrefix);
            msg.reply(`${number} xp wurden ${user} hinzugefügt!`);

        }    
	},
};