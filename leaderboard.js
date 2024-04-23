const Discord = require("discord.js");
const utils = require("./utils.js");
const config = require("./config.json");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});


exports.createMonthlyCopy = function() {
    const date = new Date();
    const dateString = `${date.getMonth() + 1}_${date.getFullYear()}`;
    db.prepare(`--sql
        CREATE TABLE IF NOT EXISTS xpLevelsMonthly_${dateString}
        AS
        SELECT
            userId,
            guildId,
            level,
            xp
        FROM xpLevels
        WHERE acceptLB = 1;
    `).run();
};


const writeLBOptin = db.prepare(`--sql
INSERT INTO xpLevels (userId, guildId, acceptLB)
    VALUES (?, ?, ?)
    ON CONFLICT(userId, guildId)
    DO UPDATE SET
        acceptLB = excluded.acceptLB
        WHERE acceptLB <> excluded.acceptLB;
`);

exports.changeAcceptLB = function(button, optState) {
    writeLBOptin.run(button.user.id, button.guildId, optState);
};
