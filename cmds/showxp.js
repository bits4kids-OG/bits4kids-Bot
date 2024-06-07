const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const fs = require("fs");
const utils = require("../utils.js");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});

const stmt = db.prepare(`--sql
    SELECT
        userId,
        level,
        xp,
        last_message,
        timeout
    FROM xpLevels_UserXPData
    WHERE guildId = ?;
`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("showxp")
        .setDescription("Zeigt die XP und Level von allen auf dem Server.")
        .setDefaultPermission(false),
    async execute(msg, args, client) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }

        msg.reply("Will send you a DM!\nThis process will take a few minutes.");
        const xpList = new Discord.EmbedBuilder()
            .setColor(utils.randomColor())
            .setTitle("XP und Levels von folgenden Benutzer:innen sind in meiner Datenbank:")
            .setThumbnail(client.user.avatarURL());
        const exctDate = new Date();

        const allXP = stmt.all(msg.guild.id);
        if(allXP.length === 0) {
            xpList.addFields({ name: "Keine gespeicherten XP", value: "für diesen Server!" });
        } else {
            xpList.addFields({ name: `${allXP.length} Benutzer:innen mit gespeicherten XP`, value: "in der Datenbank hinterlegt!" });
            let allUserString = "Username;Level;XP;Timeout bis;\n"; // CSV Spaltennamen
            for(const userXP of allXP) {
                let userString = "";

                let user = client.users.cache.get(userXP.userId);
                if(!user) user = await client.users.fetch(userXP.userId).catch(console.error);

                if(userXP.timeout >= Date.now()) {
                    const timeoutDate = new Date(userXP.timeout);
                    // Name in Anführungszeichen, damit auch Namen, die ";" enthalten korrekt dargestellt werden
                    userString = `"${user.tag.replaceAll("\"", "\"\"")}";${userXP.level};${userXP.xp};"${timeoutDate.toLocaleString("de-DE").replace(",", "")}"\n`;
                } else {
                    userString = `"${user.tag.replaceAll("\"", "\"\"")}";${userXP.xp};${userXP.level};\n`;
                }
                allUserString = allUserString + userString;
            }
            msg.author.send({ embeds: [xpList] });
            const buffer = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(allUserString, "utf-8")]);
            const attachment = new Discord.AttachmentBuilder(buffer, { name: `${msg.guild.name}_xp_${exctDate.toLocaleString("en-CA", { hour12: false }).replace(",", "").replaceAll(":","-")}.csv` });
            await msg.author.send({
                content: "File containing the data:\nPlease download and open the file in Excel.",
                files: [attachment]
            });
        }

        if(args[0] && args[0] === "old") {
            let XP = {};
            if(fs.existsSync("./xp.json")) {
                XP = JSON.parse(fs.readFileSync("./xp.json", "utf8"));
            }
            if(msg.guild.id in XP === false) {
                XP[msg.guild.id] = {};
                fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
                    if(err) console.log(err);
                });
            }
            const guildXP = XP[msg.guild.id];
    
            let xpEmpty = [];
            let allUserString = "Username;Level;XP;Timeout bis;\n"; // CSV Spaltennamen
            let sendString = false;
    
            for(const key in guildXP) {
                let userString = "";
    
                let user = client.users.cache.get(key);
                if(!user) user = await client.users.fetch(key).catch(console.error);
                
                xpEmpty.push(key);
                let xp = guildXP[key].xp;
                let level = guildXP[key].level;
    
                if(guildXP[key].timeout >= Date.now()) {
                    const timeoutDate = new Date(guildXP[key].timeout);
                    // Name in Anführungszeichen, damit auch Namen, die ";" enthalten korrekt dargestellt werden
                    userString = `"${user.tag.replaceAll("\"", "\"\"")}";${level};${xp};"${timeoutDate.toLocaleString("de-DE").replace(",", "")}"\n`;
                    //xpList.addField(`${user.tag}:` , `XP: ${xp}\nLevel: ${level}\nTimeout bis: ${timeoutDate.toLocaleString("de-DE")}`);
                } else {
                    userString = `"${user.tag.replaceAll("\"", "\"\"")}";${xp};${level};\n`;
                    //xpList.addField(`${user.tag}:` , `XP: ${xp}\nLevel: ${level}`);
                }
                allUserString = allUserString + userString;
            }
    
            if (utils.checkArrayEmpty(xpEmpty) == true) {
                msg.author.send("Keine gespeicherten XP für diesen Server!");
            } else {
                msg.author.send(`${xpEmpty.length} Benutzer:innen mit gespeicherten XP in den alten Daten hinterlegt!`);
                sendString = true;
            }
    
            if(sendString == true) {
                // UTF-8 Byte Order Mark \xEF\xBB\xBF vor den Text geben, damit Excel die Datei richtig lädt
                const buffer = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(allUserString, "utf-8")]);
                const attachment = new Discord.AttachmentBuilder(buffer, { name: `${msg.guild.name}_xp_${exctDate.toLocaleString("en-CA", { hour12: false }).replace(",", "").replaceAll(":","-")}.csv` });
                msg.author.send({
                    content: "File containing the data:\nPlease download and open the file in Excel.",
                    files: [attachment]
                });
            }
        }
        return;
    },
};