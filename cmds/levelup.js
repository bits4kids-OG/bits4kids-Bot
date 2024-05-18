const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const xp_levels = require("../xp-and-levels.js");
const config = require("../config.json");
const utils = require("../utils.js");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});

const writeLevel = db.prepare(`--sql
    INSERT INTO xpLevels_UserXPData (userId, guildId, level, xp, last_message)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(userId, guildId)
        DO UPDATE SET
            level = excluded.level,
            xp = excluded.xp,
            last_message = excluded.last_message;
`);
const insertXPHistory = db.prepare(`--sql
    INSERT INTO xpLevels_HistoryData (userId, guildId, changeDate, level, xp)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(userId, guildId, changeDate)
        DO UPDATE SET
            level = excluded.level;
`);

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
            const normalTrainRole = msg.guild.roles.cache.find(r => r.id === config.TrainerRolle);
            const trainRole = msg.guild.roles.cache.find(r => r.id === config.OnlineTrainerRolle);
            const orgRole = msg.guild.roles.cache.find(r => r.id === config.OrganisationRolle);
            const member = msg.guild.members.cache.get(user.id);
            if ((normalTrainRole) && (trainRole) && (orgRole) && (member.roles) && ((member.roles.cache.has(normalTrainRole.id)) || (member.roles.cache.has(trainRole.id)) || (member.roles.cache.has(orgRole.id)))) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }

            const userXP = utils.getXP(msg, user);

            userXP.level++;
            userXP.last_message = Date.now();
        
            writeLevel.run(user.id, msg.guild.id, userXP.level, userXP.xp, userXP.last_message);

            const todaysDate = new Date().setHours(0,0,0,0);
            insertXPHistory.run(user.id, msg.guild.id, todaysDate, userXP.level, userXP.xp);

            xp_levels.levelUp(msg, user, guildPrefix, userXP);
            msg.reply(`${user} wurde auf das nächste Level ${userXP.level} gesetzt!`);
        }
    },
};