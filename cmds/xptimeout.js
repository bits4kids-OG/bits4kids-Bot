const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const utils = require("../utils.js");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});

const writeXPtimeout = db.prepare(`--sql
    INSERT INTO xpLevels_UserXPData (userId, guildId, timeout)
        VALUES (?, ?, ?)
        ON CONFLICT(userId, guildId)
        DO UPDATE SET
            timeout = excluded.timeout;
`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xptimeout")
        .setDescription("Restricts the pinged user from getting XP.")
        .setDefaultPermission(false),
    async execute(msg, args, client, guildPrefix) {
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
            let member = msg.guild.members.cache.get(user.id);
            if(!member) member = await msg.guild.members.fetch(user.id).catch(console.error);
            if(member.roles && utils.checkIfTrainer(member.roles.cache) === true) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }

            const userXP = utils.getXP(msg, user);

            const minute = 1000 * 60;
            const hour = minute * 60;
            const day = hour * 24;

            const timeoutDuration = number * day;
            const timeout = Date.now() + timeoutDuration;

            userXP.timeout = timeout;
        
            writeXPtimeout.run(user.id, msg.guild.id, userXP.timeout);

            const timeoutDate = new Date(userXP.timeout);
            msg.reply(`${user} hat ein Timeout von ${number} Tagen erhalten!\nIm Timeout bis: ${timeoutDate.toLocaleString("en-GB")}`);

        }
    },
};