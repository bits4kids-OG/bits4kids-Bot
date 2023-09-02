const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

const config = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("umfrage")
        .setDescription("Creates a survey.")
        .setDefaultPermission(false),
    async execute(msg) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }        

        await msg.channel.messages.fetch({ limit: 2 }).then(messages => {
            let lastMessage = messages.last();
            
            if (!lastMessage.author.bot) {
                lastMessage.react(config.reactGreen)
                    .then(() => lastMessage.react(config.reactRed))
                    .catch(error => console.error("One of the emojis failed to react:", error));
            }
        })
            .catch(console.error);

        msg.delete();
    
    },
};