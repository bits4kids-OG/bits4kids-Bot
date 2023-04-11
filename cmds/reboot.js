const { SlashCommandBuilder } = require("@discordjs/builders");
const config = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reboot")
        .setDescription("Restarts the bot.")
        .setDefaultPermission(false),
    execute(msg) {
        if (config.owner.includes(msg.author.id)) {
            msg.reply("Restarting!").then(function () {
                console.log("Restarted by " + msg.author.tag);
                process.exit(0);
            });
        } else {
            msg.author.send("Das darfst du nicht machen!");
        }
    },
};