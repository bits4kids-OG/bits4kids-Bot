const lbConfig = require("./leaderboardConfig.json");

const {google} = require("googleapis");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});

const stream = require("stream");

const canvacord = require("canvacord");
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


exports.createLeaderboard = async function(client, guildId = lbConfig.defaultGuildId, lbUserLimit = 25) {
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
            WHERE
                history.changeDate >= ?
            GROUP BY
                history.userId,
                history.guildId
        ),
        baseXpLevelData
        AS (
            SELECT
                newest.userId,
                newest.guildId,
                newest.acceptLB,
                (newest.level - COALESCE(oldest.level, 0)) AS levelDifference,
                (newest.xp - COALESCE(oldest.xp, 0)) AS xpDifference
            FROM xpLevels_UserXPData newest
            INNER JOIN MonthOldXp oldest ON
                newest.userId = oldest.userId AND
                newest.guildId = oldest.guildId
            WHERE
                newest.level IS NOT NULL AND
                newest.xp IS NOT NULL
        )
        SELECT
            userId,
            guildId,
            (1/6)*POWER(levelDifference,3) + 5*POWER(levelDifference,2) + 100*levelDifference + xpDifference AS totalXpDifference
        FROM baseXpLevelData
        WHERE
            --acceptLB = 1 AND
            (levelDifference > 0 OR xpDifference > 0) AND
            guildId = ?
        ORDER BY totalXpDifference DESC
        LIMIT ?;
    `).all(oneMonthAgo, guildId, lbUserLimit);

    let guild = client.guilds.cache.get(guildId);
    if(!guild) guild = await client.guilds.fetch(guildId).catch(console.error) ?? {
        name: "",
        iconURL: () => "https://cdn.discordapp.com/embed/avatars/1.png",
    };
    let sheetsData = [];
    let contentString = "UserName;TotalXpDifferenceLast30Days;GuildName;OCCs;UserId;GuildId\n";
    const numOfColumns = (contentString.split("\n")[0].match(/;/g) || []).length + 1;
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
        let roleNames = "";
        if(guild.members) {
            const member = guild.members.cache.get(user.id) || await guild.members.fetch(user.id).catch(console.error);
            if(member?.roles) {
                const OCCroles = member.roles.cache.filter((role) => lbConfig.OCCroleIds.includes(role.id)).map((role) => role.name);
                roleNames = OCCroles.join("; ");
            }
        }
        sheetsData.push(
            [user.tag, rowOrig.totalXpDifference, guild.name, roleNames, rowOrig.userId, rowOrig.guildId]
        );
        contentString = contentString + `"${user.tag.replaceAll("\"", "\"\"")}";${rowOrig.totalXpDifference};"${guild.name}";"${roleNames}";${rowOrig.userId};${rowOrig.guildId}\n`;
        canvasData.push({
            username: user.username,
            displayName: user.displayName,
            avatar: user.displayAvatarURL(),
            xp: rowOrig.totalXpDifference,
            rank: canvasData.length + 1
        });
    }
    sheetsData = [...sheetsData, ...Array(Math.max((lbUserLimit - sheetsData.length), 0)).fill(Array(numOfColumns).fill(""))];
    canvasData = canvasData.slice(0,3);
    if(canvasData.length > 0) {
        const canvas = await buildLeaderboardCanvas(canvasData, guild, oneMonthAgo);
        uploadCanvasToDrive(canvas);
    }
    uploadDataToDrive(sheetsData);
    uploadCSVToDrive(contentString);
};


async function uploadDataToDrive(data) {
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

    const auth = new google.auth.GoogleAuth({ keyFile: "./credentials.json", scopes: scopes });
    const service = google.sheets({ version: "v4", auth });

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
    const fileName = `bits4kidsBot_LeaderBoardExport_${new Date().toLocaleDateString("en-CA", { dateStyle: "short" }).replaceAll("-","_")}.csv`;
    const scopes = ["https://www.googleapis.com/auth/drive"];

    const auth = new google.auth.GoogleAuth({ keyFile: "./credentials.json", scopes: scopes });
    const drive = google.drive({ version: "v3", auth });
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
        console.log("Successfully uploaded the csv to Google Drive!");
        return(res.data);
    } catch (err) {
        console.error(err);
    }
}

canvacord.Font.loadDefault();
async function buildLeaderboardCanvas(canvasData, guild, oneMonthAgo) {
    const card = new canvacord.LeaderboardBuilder()
        .setHeader({
            title: guild.name,
            image: guild.iconURL(),
            subtitle: `Leaderboard ${new Date(oneMonthAgo).toLocaleDateString("de-AT", { dateStyle: "medium" })} - ${new Date().toLocaleDateString("de-AT", { dateStyle: "medium" })}`
        })
        .setTextStyles({
            level: "Aktivitätslevel:"
        })
        .setPlayers(canvasData)
        .setVariant("default");
    try {
        const image = await card.build({ format: "png" });
        return image;
    } catch (error) {
        const logChannel = utils.findLogChannel(guild);
        logChannel?.send("Encountered an error while trying to create the leaderboard canvas!", error);
    }
}

async function uploadCanvasToDrive(canvas) {
    const scopes = ["https://www.googleapis.com/auth/drive"];

    const auth = new google.auth.GoogleAuth({ keyFile: "./credentials.json", scopes: scopes });
    const drive = google.drive({ version: "v3", auth });
    const media = {
        mimeType: "image/png",
        body: stream.Readable.from(canvas),
    };
    try {
        const res = await drive.files.update({
            fileId: lbConfig.driveExportCanvasId,
            media: media,
            fields: "id, webViewLink"
        });
        console.log("Successfully uploaded the canvas to Google Drive!");
        return(res.data);
    } catch (err) {
        console.error(err);
    }
}