const { SlashCommandBuilder } = require('@discordjs/builders');

const Blackjack = require("../blackjack.js");
const blackjackGames = {};

module.exports = {
	data: new SlashCommandBuilder()
		.setName("blackjack")
		.setDescription("Hier kannst du mit dem Bot als Dealer Blackjack spielen."),
	execute(msg, args) {
        if (blackjackGames[msg.author.id]) {
            if (args[0] && args[0] === "end") {
              blackjackGames[msg.author.id].end();
              msg.reply({ content: "Blackjack beendet.", allowedMentions: { repliedUser: false }});
            } else {
              msg.reply("Du spielst bereits Blackjack!");
            }
          } else {
            if (!args[0]) {
              blackjackGames[msg.author.id] = new Blackjack(msg, () => {
              delete blackjackGames[msg.author.id];
            });
            blackjackGames[msg.author.id].start();
            } else {
              msg.reply("Falsche Benutzung!");
            }
          }
	},
};