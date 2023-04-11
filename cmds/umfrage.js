const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("umfrage")
        .setDescription("Creates a survey.")
        .setDefaultPermission(false),
    async execute(msg) {
        if (!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }        

        await msg.channel.messages.fetch({ limit: 2 }).then(messages => {
            let lastMessage = messages.last();
            
            if (!lastMessage.author.bot) {
                lastMessage.react("<:Roboter_gruen:933371228142579833>")
                    .then(() => lastMessage.react("<:Roboter_rot:933371300817272883>"))
                    .catch(error => console.error("One of the emojis failed to react:", error));
            }
        })
            .catch(console.error);

        msg.delete();
    
    },
};