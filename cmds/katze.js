const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");
const fetch = require("node-fetch");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("katze")
        .setDescription("Zeigt ein zufälliges Katzenbild an."),
    async execute(msg, args) {
        let catUrl;
        if(!args[0]) {
            try {
                const catObj = await (await fetch("https://cataas.com/cat?json=true")).json();
                catUrl = `https://cataas.com/${catObj.url}`;
            } catch (error) {
                msg.reply("Fehler: Die Katzen schlafen gerade.");
                console.log(error);
            }
        } else {
            try {
                let text = args.join(" ").replace(/[\u00A0-\u9999<>&]/g, i => "&#"+i.charCodeAt(0)+";");
                const catObj = await (await fetch(`https://cataas.com/cat/says/${text}?json=true`)).json();
                catUrl = `https://cataas.com/${catObj.url}`;
            } catch (error) {
                msg.reply("Fehler: Die Katzen schlafen gerade.");
                console.log(error);
            }
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
    },
};