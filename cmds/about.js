const { SlashCommandBuilder } = require('@discordjs/builders');
const { version } = require("../package.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("about")
		.setDescription("Zeigt Infos über den Bot an."),
	execute(msg, args, client, guildPrefix) {
        msg.reply(
            `Hallo! Ich bin ein nützlicher Discord Bot, der vom Programmierer und Discord-Benutzer emeraldingg#2697 erstellt wurde. Mein aktueller Prefix ist ${guildPrefix}. Mit mir kannst du Katzenfotos bekommen, zufällige Zahlen erstellen und Blackjack spielen.\nIch hoffe du hast Spaß! Version: ${version}`
          );
	},
};