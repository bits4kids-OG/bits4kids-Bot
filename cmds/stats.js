const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");
const { version } = require("../package.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Einige Statistiken zum Bot."),
    execute(msg, args, client, guildPrefix) {
        let seconds = process.uptime();
        const days = Math.floor(seconds / 86400);
        seconds %= 86400;
        const hrs = Math.floor(seconds / 3600);
        seconds %= 3600;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const uptime =
          days +
          " Tage, " +
          hrs +
          " Stunden, " +
          mins +
          " Minuten und " +
          Math.round(secs) +
          " Sekunden";
  
        const stats = new Discord.EmbedBuilder()
            .setColor(utils.randomColor())
            .setTitle("Statistiken für den bits4kids-Bot:")
            .setDescription(
                `Hallo! Ich bin ein nützlicher Discord Bot, der vom Programmierer und Discord-Benutzer emeraldingg#2697 erstellt wurde. Mein aktueller Prefix ist ${guildPrefix}. Mit mir kannst du Katzenfotos bekommen, zufällige Zahlen erstellen und Blackjack spielen.\nIch hoffe du hast Spaß! Version: ${version}`
            )
            .setThumbnail(client.user.avatarURL())
            .addFields([
                { name: "Ersteller:", value: "emeraldingg#2697" },
                //{ name: "Invite:", value: `[Click Here](${config.invite})` },
                { name: "Anzahl an Servern", value: client.guilds.cache.size.toString() },
                { name: "Kanäle", value: client.channels.cache.size.toString() },
                { name: "Anzahl an Benutzern", value: client.users.cache.size.toString() },
                { name: "Uptime", value: uptime.toString() },
                { name: "RAM Benutzung", value: Math.round(process.memoryUsage().rss / 1024 / 1024).toString() + " MB" }
            ]);
        msg.reply({ embeds: [stats] });
    },
};