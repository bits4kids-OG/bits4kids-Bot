const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const xp_levels = require("../xp-and-levels.js");
const config = require("../config.json");
const utils = require("../utils.js");

const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("levelup")
        .setDescription("Lifts the user's xp-level.")
        .setDefaultPermission(false),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        if(!args[0] || !msg.mentions.users.first()) {
            msg.reply(`Correct usage: ${guildPrefix}levelup <@user>`);
            return;
        } else {
            const user = msg.mentions.users.first();

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

            userXP.level++;
            userXP.last_message = Date.now();
        
            fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
                if(err) console.log(err);
            });

            xp_levels.levelUp(msg, user, guildPrefix);
            msg.reply(`${user} wurde auf das nächste Level ${userXP.level} gesetzt!`);

        }
    
    },
};