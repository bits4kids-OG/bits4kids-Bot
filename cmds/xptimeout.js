const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const config = require("../config.json");
const utils = require("../utils.js");

const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xptimeout")
        .setDescription("Restricts the pinged user from getting XP.")
        .setDefaultPermission(false),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        if(!args[0] || !args[1] || isNaN(args[1]) || !msg.mentions.users.first()) {
            msg.reply(`Correct usage: ${guildPrefix}timeout <@user> <amount in days>`);
            return;
        } else if ((utils.isInDesiredForm(args[1]) === false) || (utils.testNumber(args[1]) == null) || (utils.testNumber(args[1]) > 100)) {
            msg.reply("Invalid timeout duration!");
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

            const minute = 1000 * 60;
            const hour = minute * 60;
            const day = hour * 24;

            const timeoutDuration = number * day;
            const timeout = Date.now() + timeoutDuration;

            userXP.timeout = timeout;
        
            fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
                if(err) console.log(err);
            });

            const timeoutDate = new Date(userXP.timeout);
            msg.reply(`${user} hat ein Timeout von ${number} Tagen erhalten!\nIm Timeout bis: ${timeoutDate.toLocaleString("en-GB")}`);

        }
    },
};