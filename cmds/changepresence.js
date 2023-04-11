const { SlashCommandBuilder } = require("@discordjs/builders");
const config = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("changepresence")
        .setDescription("Changes the presence of the bot.")
        .setDefaultPermission(false),
    execute(msg, args, client, guildPrefix) {
        if (config.owner.includes(msg.author.id)) {
            if (!args[0]) {
                msg.reply(`Correct usage: ${guildPrefix}changepresence <status (online, idle, ...)> <text that will be shown>`);
                return;
            }
            const status = args.shift().toLowerCase();
            client.user
                .setPresence({ activities: [{ name: args.join(" ") }], status: status });
        } else {
            msg.author.send("Das darfst du nicht machen!");
        }
    },
};