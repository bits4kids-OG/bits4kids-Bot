const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const xp_levels = require("../xp-and-levels.js");
const config = require("../config.json");
const utils = require("../utils.js");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});

const writeLevel = db.prepare(`--sql
    INSERT INTO xpLevels (userId, guildId, level, xp, last_message)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(userId, guildId)
        DO UPDATE SET
            level = excluded.level,
            xp = excluded.xp,
            last_message = excluded.last_message;
`);

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

            const userXP = utils.getXP(msg, user);

            if(userXP.level >= number) {
                userXP.xp = 0;
            }

            userXP.level = number;
            userXP.last_message = Date.now();
        
            writeLevel.run(user.id, msg.guild.id, userXP.level, userXP.xp, userXP.last_message);

            xp_levels.levelUp(msg, user, guildPrefix, userXP);
            msg.reply(`${user} wurde auf Level ${number} gesetzt!`);

        }    
    },
};