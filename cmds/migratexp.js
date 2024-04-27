const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const config = require("../config.json");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});

module.exports = {
    data: new SlashCommandBuilder()
        .setName("migratexp")
        .setDescription("Migrates all xp from JSON to Sqlite3.")
        .setDefaultPermission(false),
    async execute(msg) {
        if (!config.owner.includes(msg.author.id)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }

        let XP = {};
        if(fs.existsSync("./xp.json")) {
            XP = JSON.parse(fs.readFileSync("./xp.json", "utf8"));
        }

        const insertXP = db.prepare(`--sql
            INSERT INTO xpLevels (userId, guildId, level, xp, last_message, timeout)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(userId, guildId)
                DO UPDATE SET
                    level = excluded.level,
                    xp = excluded.xp,
                    last_message = excluded.last_message,
                    timeout = excluded.timeout;
        `);
        let insertCount = 0;
        for(const guildId in XP) {
            msg.reply(`Adding XP for guild ${guildId}.`);
            let guildXP = XP[guildId];
            for(const userId in guildXP) {
                let userLevel = guildXP[userId].level;
                let userXp = guildXP[userId].xp;
                let lastMessage = guildXP[userId].last_message;
                if((guildXP[userId].level === 0) && (guildXP[userId].xp === 0)) {
                    userLevel = null;
                    userXp = null;
                    lastMessage = null;
                }
                let userTimeout = null;
                if(guildXP[userId].timeout != 0) {
                    userTimeout = guildXP[userId].timeout;
                }
                insertXP.run(userId, guildId, userLevel, userXp, lastMessage, userTimeout);
                insertCount++;
            }
        }
        msg.reply(`Successfully migrated ${insertCount} users to the new database!`);
        return;
    },
};