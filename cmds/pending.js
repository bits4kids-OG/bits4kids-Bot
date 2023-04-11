const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pending")
        .setDescription("Shows which members are still pending.")
        .setDefaultPermission(false),
    async execute(msg, args, client, guildPrefix, invites, fromWhere) {
        const guildMember = fromWhere[msg.guild.id];
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        msg.reply("Sent you a DM!");
        const linkList = new Discord.EmbedBuilder()
            .setColor(utils.randomColor())
            .setTitle("These members are still pending:")
            .setThumbnail(client.user.avatarURL());

        let listEmpty = [];

        for(const key in guildMember) {
            const member = await client.users.fetch(key).catch(console.error);
            listEmpty.push(key);
            let memberList = guildMember[key];
            linkList.addFields([
                { name: "Member:", value: member.tag },
                { name: "Invite used:", value: "https://discord.gg/" + memberList }
            ]);
        }

        if (utils.checkArrayEmpty(listEmpty) == true) {
            linkList.addFields({ name: "There were no", value: "pending users!" });
        } else {
            linkList.addFields({ name: `I found ${listEmpty.length}`, value: "pending users!" });
        }

        msg.author.send({ embeds: [linkList] });
    },
};