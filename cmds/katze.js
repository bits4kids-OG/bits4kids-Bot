const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("katze")
        .setDescription("Zeigt ein zufälliges Katzenbild an."),
    async execute(msg, args) {
        try {
            const response = await fetch("https://cataas.com/cat?json=true");
            const catObj = await response.json();
            let catUrl;
            if(!args[0]) {
                catUrl = `https://cataas.com/cat/${catObj.id}`;
            } else {
                let text = encodeURIComponent(args.join(" "));
                catUrl = `https://cataas.com/cat/${catObj.id}/says/${text}`;
            }
            const embed = new Discord.EmbedBuilder()
                .setColor(utils.randomColor())
                .setTitle("Katze")
                .setImage(catUrl)
                .setURL(catUrl)
                .setFooter({
                    text: "Funktioniert mit cataas.com"
                });
            msg.reply({ embeds: [embed] });
        } catch (error) {
            msg.reply("Fehler: Die Katzen schlafen gerade.");
            console.log(error);
        }
    },
};
