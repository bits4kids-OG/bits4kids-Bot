const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");
const { version } = require("../package.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Einige Statistiken zum Bot."),
    execute(msg, args, client, guildPrefix) {
        var seconds = process.uptime();
        days = Math.floor(seconds / 86400);
        seconds %= 86400;
        hrs = Math.floor(seconds / 3600);
        seconds %= 3600;
        mins = Math.floor(seconds / 60);
        secs = seconds % 60;
        var uptime =
          days +
          " Tage, " +
          hrs +
          " Stunden, " +
          mins +
          " Minuten und " +
          Math.round(secs) +
          " Sekunden";
  
        const stats = new Discord.MessageEmbed()
            .setColor(utils.randomColor())
            .setTitle("Statistiken für den bits4kids-Bot:")
            .setDescription(
                `Hallo! Ich bin ein nützlicher Discord Bot, der vom Programmierer und Discord-Benutzer emeraldingg#2697 erstellt wurde. Mein aktueller Prefix ist ${guildPrefix}. Mit mir kannst du Katzenfotos bekommen, zufällige Zahlen erstellen und Blackjack spielen.\nIch hoffe du hast Spaß! Version: ${version}`
            )
            .setThumbnail(client.user.avatarURL())
            .addField("Ersteller:", "emeraldingg#2697")
        //.addField("Invite:", `[Click Here](${config.invite})`)
            .addField("Anzahl an Servern", client.guilds.cache.size.toString())
            .addField("Kanäle", client.channels.cache.size.toString())
            .addField("Anzahl an Benutzern", client.users.cache.size.toString())
            .addField("Uptime", uptime.toString())
            .addField(
                "RAM Benutzung",
                Math.round(process.memoryUsage().rss / 1024 / 1024).toString() + " MB"
            );
        msg.reply({ embeds: [stats] });
    },
};