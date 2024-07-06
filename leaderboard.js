const lbConfig = require("./leaderboardConfig.json");

const {google} = require("googleapis");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});

const Discord = require("discord.js");
const canvacord = require("canvacord");
const { LeaderboardCanvas } = require("./leaderboardCanvas.js");
const utils = require("./utils.js");


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


exports.createLeaderboard = async function(client, guildId = lbConfig.defaultGuildId) {
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
                --current.acceptLB = 1 AND
                history.level IS NOT NULL
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
                --acceptLB = 1 AND
                newest.level IS NOT NULL
                AND newest.xp IS NOT NULL
        )
        SELECT
            userId,
            guildId,
            (1/6)*POWER(levelDifference,3) + 5*POWER(levelDifference,2) + 100*levelDifference + xpDifference AS totalXpDifference
        FROM baseXpLevelData
        WHERE
            totalXpDifference > 0 AND
            guildId = ?
        ORDER BY totalXpDifference DESC;
        --LIMIT 10;
    `).all(oneMonthAgo, guildId);
    console.log(leaderBoardTop10);

    let guild = client.guilds.cache.get(guildId);
    if(!guild) guild = await client.guilds.fetch(guildId).catch(console.error) ?? {
        name: "",
        iconURL: () => "https://cdn.discordapp.com/embed/avatars/1.png",
    };
    let data = [];
    let contentString = "UserName;TotalXpDifferenceLast30Days;GuildName;UserId;GuildId\n";
    let canvasData = [];
    for(const rows in leaderBoardTop10) {
        const rowOrig = leaderBoardTop10[rows];
        let user = client.users.cache.get(rowOrig.userId);
        if(!user) user = await client.users.fetch(rowOrig.userId).catch(console.error) ?? {
            tag: "",
            username: "User not found",
            displayName: "User not found",
            displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/1.png",
        };
        data.push(
            [user.tag, rowOrig.totalXpDifference, guild.name, rowOrig.userId, rowOrig.guildId]
        );
        contentString = contentString + `"${user.tag.replaceAll("\"", "\"\"")}";${rowOrig.totalXpDifference};"${guild.name}";${rowOrig.userId};${rowOrig.guildId}\n`;
        canvasData.push({
            username: user.username,
            displayName: user.displayName,
            avatar: user.displayAvatarURL(),
            xp: rowOrig.totalXpDifference,
            rank: canvasData.length + 1
        });
    }
    console.log(data);
    if(canvasData.length > 0) await buildLeaderboardCanvas(client, canvasData, guild);
    // await uploadDataToDrive(data);
    // await uploadCSVToDrive(contentString);
};


async function uploadDataToDrive(data) {
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

    const auth = new google.auth.GoogleAuth({keyFile: "./credentials.json", scopes: scopes});
    const service = google.sheets({version: "v4", auth});

    const resource = {
        values: data
    };
    try {
        const result = await service.spreadsheets.values.update({
            spreadsheetId: lbConfig.driveExportSheetId,
            range: "LeaderBoardData!A2",
            valueInputOption: "RAW",
            resource
        });
        console.log(`${result.data.updatedCells ?? 0} cells updated.`);
        return result;
    } catch (err) {
        console.log(err);
    }
}

async function uploadCSVToDrive(content) {
    const fileName = `bits4kidsBot_LeaderBoardExport_${new Date().toLocaleDateString("en-CA", { dateStyle: "short" }).replaceAll("-","_")}`;
    const scopes = ["https://www.googleapis.com/auth/drive"];

    const auth = new google.auth.GoogleAuth({keyFile: "./credentials.json", scopes: scopes});
    const drive = google.drive({version: "v3", auth});
    const fileMetaData = {
        name: fileName,
        parents: [lbConfig.driveExportFolderId],
        mimeType: "text/csv"
    };
    const media = {
        mimeType: "text/csv",
        body: content,
    };
    try {
        const res = await drive.files.create({
            requestBody: fileMetaData,
            media: media,
            fields: "id, webViewLink"
        });
        return(res.data);
    } catch (err) {
        console.error(err);
    }
}

canvacord.Font.loadDefault();
async function buildLeaderboardCanvas(client, canvasData, guild) {
    const card = new canvacord.LeaderboardBuilder()
        .setHeader({
            title: guild.name,
            image: guild.iconURL(),
            subtitle: `Leaderboard ${new Date().toLocaleDateString("de-AT", { dateStyle: "medium" })}`
        })
        .setTextStyles({
            level: "XP Difference:"
        })
        .setPlayers(canvasData)
        .setVariant("default");
    try {
        const image = await card.build({ format: "png" });
        const imageMsg = new Discord.AttachmentBuilder(image, {name: "LeaderBoard.png"});
        const user = await client.users.fetch(lbConfig.sendToUserId);
        user.send({
            content: "LeaderBoard:",
            files: [imageMsg],
        });
    } catch (error) {
        const logChannel = utils.findLogChannel(guild);
        logChannel?.send("Encountered an error while trying to create the leaderboard canvas!", error);
    }
}