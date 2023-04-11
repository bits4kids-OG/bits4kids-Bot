const { SlashCommandBuilder } = require("@discordjs/builders");
const utils = require("../utils.js");
const config = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Announces a message across all servers.")
        .setDefaultPermission(false),
    execute(msg, args, client) {
        if (config.owner.includes(msg.author.id)) {
            if (!args[0]) return;
            const text = args.join(" ");
            let errorGuilds = [];
            client.guilds.cache.forEach((guild) => {
                const channel = utils.findGoodChannel(guild);
                if (channel) {
                    channel.send(text).catch(console.error);
                } else {
                    errorGuilds.push(guild.name);
                }
            });
            if (errorGuilds.length > 0) {
                msg.reply(
                    `Could not announce to the following servers ${errorGuilds.join(
                        ", "
                    )}`
                );
            }
        } else {
            msg.author.send("Das darfst du nicht machen!");
        }
    },
};