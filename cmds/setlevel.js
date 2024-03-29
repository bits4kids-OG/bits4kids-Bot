const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const xp_levels = require("../xp-and-levels.js");
const config = require("../config.json");
const utils = require("../utils.js");

const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlevel")
        .setDescription("Lifts the user to the specified xp-level.")
        .setDefaultPermission(false),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        if(!args[0] || !args[1] || isNaN(args[1]) || !msg.mentions.users.first()) {
            msg.reply(`Correct usage: ${guildPrefix}setlevel <@user> <level>`);
            return;
        } else if ((utils.isInDesiredForm(args[1]) === false) || (utils.testNumber(args[1]) == null) || (utils.testNumber(args[1]) > 200)) {
            msg.reply("Invalid level amount!");
            return;
        } else {
            const user = msg.mentions.users.first();
            const number = utils.testNumber(args[1]);

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

            const XP = utils.getXP(msg, user);
            const userXP = XP[msg.guild.id][user.id];

            if(userXP.level >= number) {
                userXP.xp = 0;
            }

            userXP.level = number;
            userXP.last_message = Date.now();
        
            fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
                if(err) console.log(err);
            });

            xp_levels.levelUp(msg, user, guildPrefix);
            msg.reply(`${user} wurde auf Level ${number} gesetzt!`);

        }    
    },
};