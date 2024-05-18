const Discord = require("discord.js");
const utils = require("./utils.js");
const config = require("./config.json");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});


exports.createLeaderboard = function() {
    const oneMonthAgo = new Date().addMonths(-1).setHours(0,0,0,0);
    const leaderBoardTop10 = db.prepare(`--sql
        WITH MonthOldXp
        AS (
            SELECT
                history.userId,
                history.guildId,
                MIN(history.changeDate) AS changeDate,
                history.level,
                history.xp
            FROM xpLevels_HistoryData history
            LEFT JOIN xpLevels_UserXPData current ON
                current.userId = history.userId
                AND current.guildId = history.guildId
            WHERE
                acceptLB = 1
                AND history.level IS NOT NULL
                AND history.xp IS NOT NULL
                AND history.changeDate >= ?
            GROUP BY
                history.userId,
                history.guildId
        ),
        baseXpLevelData
        AS (
            SELECT
                newest.userId,
                newest.guildId,
                (newest.level - COALESCE(oldest.level, 0)) AS levelDifference,
                (newest.xp - COALESCE(oldest.xp, 0)) AS xpDifference
            FROM xpLevels_UserXPData newest
            LEFT JOIN MonthOldXp oldest ON
                newest.userId = oldest.userId
                AND newest.guildId = oldest.guildId
            WHERE
                acceptLB = 1
                AND newest.level IS NOT NULL
                AND newest.xp IS NOT NULL
        )
        SELECT
            userId,
            guildId,
            (1/6)*POWER(levelDifference,3) + 5*POWER(levelDifference,2) + 100*levelDifference + xpDifference AS totalXpDifference
        FROM baseXpLevelData
        ORDER BY totalXpDifference DESC
        LIMIT 10;
    `).all(oneMonthAgo);
    console.log(leaderBoardTop10);
};


const writeLBOptin = db.prepare(`--sql
INSERT INTO xpLevels_UserXPData (userId, guildId, acceptLB)
    VALUES (?, ?, ?)
    ON CONFLICT(userId, guildId)
    DO UPDATE SET
        acceptLB = excluded.acceptLB
        WHERE acceptLB <> excluded.acceptLB;
`);

exports.changeAcceptLB = function(button, optState) {
    writeLBOptin.run(button.user.id, button.guildId, optState);
};
