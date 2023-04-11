const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const fs = require("fs");
const utils = require("../utils.js");

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

        const exctDate = new Date();

        let XP = JSON.parse(fs.readFileSync("./xp.json", "utf8"));
        if(msg.guild.id in XP === false) {
            XP[msg.guild.id] = {};
            fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
                if(err) console.log(err);
            });
        }
        const guildXP = XP[msg.guild.id];


        msg.reply("Sent you a DM!\nThis process will take a few minutes.");
        const xpList = new Discord.EmbedBuilder()
            .setColor(utils.randomColor())
            .setTitle("XP und Levels von folgenden Benutzern sind in meiner Datenbank:")
            .setThumbnail(client.user.avatarURL());

        let xpEmpty = [];
        let allUserString = "Username;XP;Level;Timeout bis\n"; // CSV Spaltennamen
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
                userString = `"${user.tag.replaceAll("\"", "\"\"")}";${xp};${level};"${timeoutDate.toLocaleString("de-DE").replace(",", "")}"\n`;
                //xpList.addField(`${user.tag}:` , `XP: ${xp}\nLevel: ${level}\nTimeout bis: ${timeoutDate.toLocaleString("de-DE")}`);
            } else {
                userString = `"${user.tag.replaceAll("\"", "\"\"")}";${xp};${level};\n`;
                //xpList.addField(`${user.tag}:` , `XP: ${xp}\nLevel: ${level}`);
            }
            allUserString = allUserString + userString;
        }

        if (utils.checkArrayEmpty(xpEmpty) == true) {
            xpList.addFields({ name: "Keine gespeicherten XP", value: "für diesen Server!" });
        } else {
            xpList.addFields({ name: `${xpEmpty.length} Benutzer mit gespeicherten XP`, value: "in der Datenbank hinterlegt!" });
            sendString = true;
        }

        msg.author.send({ embeds: [xpList] });
        if(sendString == true) {
            // UTF-8 Byte Order Mark \xEF\xBB\xBF vor den Text geben, damit Excel die Datei richtig lädt
            const buffer = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(allUserString, "utf-8")]);
            const attachment = new Discord.AttachmentBuilder(buffer, { name: `${msg.guild.name}_xp_${exctDate.toLocaleString("en-CA", { hour12: false }).replace(",", "").replaceAll(":","-")}.csv` });
            msg.author.send({
                content: "File containing the data:\nPlease download and open the file in Excel.",
                files: [attachment]
            });
        }
        return;
    },
};