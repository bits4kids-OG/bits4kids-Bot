const { SlashCommandBuilder } = require("@discordjs/builders");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("zufallszahl")
        .setDescription("Zeigt eine zufällige Zahl an."),
    execute(msg, args, client, guildPrefix) {
        if (!args[0] || isNaN(args[0])) {
            msg.reply(
                `Korrekte Benutzung: ${guildPrefix}zufallszahl <höchste Zahl> oder ${guildPrefix}zufallszahl <niedrigste Zahl> <höchste Zahl>`
            );
        } else if (!args[1] || isNaN(args[1])) {
            msg.reply(utils.randomNumber(0, Math.round(args[0])).toString());
        } else {
            msg.reply(utils.randomNumber(Math.round(args[0]), Math.round(args[1])).toString());
        }
    },
};