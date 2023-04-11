const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const utils = require('../utils.js');
const fetch = require("node-fetch");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("katze")
		.setDescription("Zeigt ein zufälliges Katzenbild an."),
	async execute(msg) {
        try {
            const catObj = await (await fetch("https://aws.random.cat/meow")).json();
            const embed = new Discord.MessageEmbed()
              .setColor(utils.randomColor())
              .setTitle("Katze")
              .setImage(catObj.file)
              .setURL(catObj.file)
              .setFooter({
                text: "Funktioniert mit random.cat"
              });
            msg.reply({ embeds: [embed] });
          } catch (error) {
            msg.reply("Fehler: Die Katzen schlafen gerade.");
            console.log(error);
          }
	},
};