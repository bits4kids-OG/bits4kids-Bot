const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const config = require("../config.json");
const utils = require("../utils.js");

const numberCodeReg = /^[0-9]\d*$/;

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
        } else if ((isInDesiredForm(args[1]) === false) || (testNumber(args[1]) == null)) {
            msg.reply("Invalid timeout duration!");
        } else {
            const user = msg.mentions.users.first();
            const number = testNumber(args[1]);

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

        function isInDesiredForm(str) {
            var n = Math.floor(Number(str));
            return n !== Infinity && String(n) === str && n >= 0;
        }
      
        function testNumber(number) {
            if (!numberCodeReg.test(Number(number))) return null;
            return Number(number);
        }

    },
};