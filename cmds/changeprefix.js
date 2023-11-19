const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const fs = require("fs");
const index = require("../index.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("changeprefix")
        .setDescription("Changes the prefix for this server."),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) {
            msg.author.send("Das darfst du nicht machen!");
        }
        else if (!args[0] || args[0] === "help") {
            msg.reply(`Correct usage: ${guildPrefix}changeprefix <desired prefix>`);
        }
        else if (args[0].length > 2) {
            msg.reply("Your prefix can't be longer than 2 characters!");
        }
        else {
            let prefixes = {};
            if(fs.existsSync("./prefixes.json")) {
                prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
            }
          
            if(args[0] === "+") {
                delete prefixes[msg.guild.id];
            } else {
                prefixes[msg.guild.id] = args[0];
            }
            fs.writeFileSync("./prefixes.json", JSON.stringify(prefixes, null, 2), err => {
                if(err) console.log(err);
            });

            index.getPrefixes();
            msg.reply(`Prefix changed to ${args[0]}.`);
        }
    },
};