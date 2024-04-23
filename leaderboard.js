const Discord = require("discord.js");
const utils = require("./utils.js");
const config = require("./config.json");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});


exports.createLeaderboard = function() {
    const date = new Date();
    const currMonthTable = `xpLevelsMonthly_${date.toLocaleDateString("de-AT", { month: "long" })}_${date.getFullYear()}`;
    createCurrentMonthlyCopy(currMonthTable);
    const lastMonthTable = `xpLevelsMonthly_${date.addMonths(-1).toLocaleDateString("de-AT", { month: "long" })}_${date.getFullYear()}`;
    console.log(lastMonthTable);
    const leaderBoardTop10 = db.prepare(`--sql
        SELECT
            c.userId,
            c.guildId,
            (c.level - COALESCE(l.level, 0)) AS levelDifference
        FROM ${currMonthTable} c
        LEFT JOIN ${lastMonthTable} l ON
            c.userId = l.userId AND
            c.guildId = l.guildId
        WHERE c.level IS NOT NULL
        ORDER BY levelDifference DESC
        LIMIT 10;
    `).all();
    console.log(leaderBoardTop10);
};

function createCurrentMonthlyCopy(currMonthTable) {
    db.prepare(`--sql
        CREATE TABLE IF NOT EXISTS ${currMonthTable}
        AS
        SELECT
            userId,
            guildId,
            level,
            xp
        FROM xpLevels
        WHERE acceptLB = 1;
    `).run();
}


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
