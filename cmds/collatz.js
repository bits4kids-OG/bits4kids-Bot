const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("collatz")
        .setDescription("Beschreibt das Collatz-Problem."),
    execute(msg, args, client, guildPrefix) {
        if (isNaN(args[0])) {
            msg.reply(`Korrekte Benutzung: ${guildPrefix}collatz <Zahl von 1-30>`);
            return;
        }
        let number = parseFloat(args[0]).toFixed();
        let ergebnis = utils.Collatz(msg, number);
        if (ergebnis == null) return;
        const CollatzErgebnis = new Discord.EmbedBuilder()
            .setColor(utils.randomColor())
            .setTitle("Collatz Conjecture")
            .setAuthor({
                name: "Lothar Collatz",
                iconURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Lothar_Collatz_1984.jpg/457px-Lothar_Collatz_1984.jpg"
            })
            .setDescription("Das Collatz Problem ist ein Problem in der Mathematik: Ist die Startzahl gerade, wird mit der Hälfte davon weitergerechnet. Ist die Startzahl ungerade, wird sie mit 3 multipiziert und 1 addiert. Die Frage ist, ob dabei jede Zahl in der Schleife 4-2-1 ankommt.")
            .setThumbnail(client.user.avatarURL())
            .setURL("https://de.wikipedia.org/wiki/Collatz-Problem")
            .addFields([
                { name: "Ergebnis:", value: `Für die Zahl ${number} wurde eine Tiefe von ${ergebnis[0]} erreicht. Die höchste erreichte Zahl ist ${ergebnis[1]}.` }
            ])
            .setTimestamp();
        msg.reply({ embeds: [CollatzErgebnis] });
    },
};