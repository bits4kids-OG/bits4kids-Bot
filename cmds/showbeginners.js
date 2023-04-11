const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("showbeginners")
        .setDescription("Zeigt alle in der Datenbank hinterlegten Beginner.")
        .setDefaultPermission(false),
    async execute(msg, args, client) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }

        const exctDate = new Date();

        const beginners = utils.getBeginners(msg);
        const guildbeginners = beginners[msg.guild.id];


        msg.reply("Sent you a DM!\nThis process will take a few moments.");
        const beginnerList = new Discord.EmbedBuilder()
            .setColor(utils.randomColor())
            .setTitle("Folgenden Benutzer sind als Beginner in meiner Datenbank:\n(Manuell entfernte sind trotzdem für 4 Wochen gespeichert, Entfernung aus der Datenbank erfolgt bei Beitritt eines Coding Clubs!)")
            .setThumbnail(client.user.avatarURL());

        const minute = 1000 * 60;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
          
        let beginnerEmpty = [];
        let allUserString = "Username;Gejoined am;Beginner bis\n"; // CSV Spaltennamen
        let sendString = false;

        for(const key in guildbeginners) {
            let userString = "";

            let user = client.users.cache.get(key);
            if(!user) user = await client.users.fetch(key).catch(console.error);

            beginnerEmpty.push(key);
            let time = guildbeginners[key].joined;

            let beginnerBis = time + 4*week;

            const beginnerJoinedDate = new Date(time);
            const beginnerDate = new Date(beginnerBis);

            userString = `"${user.tag.replaceAll("\"", "\"\"")}";"${beginnerJoinedDate.toLocaleString("de-DE").replace(",", "")}";"${beginnerDate.toLocaleString("de-DE").replace(",", "")}"\n`;
            allUserString = allUserString + userString;
        }

        if (utils.checkArrayEmpty(beginnerEmpty) == true) {
            beginnerList.addFields({ name: "Keine hinterlegten Beginner", value: "für diesen Server!" });
        } else {
            beginnerList.addFields({ name: `${beginnerEmpty.length} Beginner`, value: "in der Datenbank hinterlegt!" });
            sendString = true;
        }

        msg.author.send({ embeds: [beginnerList] });
        if(sendString == true) {
            // UTF-8 Byte Order Mark \xEF\xBB\xBF vor den Text geben, damit Excel die Datei richtig lädt
            const buffer = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(allUserString, "utf-8")]);
            const attachment = new Discord.AttachmentBuilder(buffer, { name: `${msg.guild.name}_beginners_${exctDate.toLocaleString("en-CA", { hour12: false }).replace(",", "").replaceAll(":","-")}.csv` });
            msg.author.send({
                content: "File containing the data:\nPlease download and open the file in Excel.",
                files: [attachment]
            });
        }
        return;
    },
};