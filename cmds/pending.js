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
        if (!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        msg.reply("Sent you a DM!");
        const linkList = new Discord.MessageEmbed()
            .setColor(utils.randomColor())
            .setTitle("These members are still pending:")
            .setThumbnail(client.user.avatarURL());

        let listEmpty = [];

        for(const key in guildMember) {
            const member = await client.users.fetch(key).catch(console.error);
            listEmpty.push(key);
            let memberList = guildMember[key];
            linkList.addField("Member:", member.tag);
            linkList.addField("Invite used:", "https://discord.gg/" + memberList);
        }

        if (utils.checkArrayEmpty(listEmpty) == true) {
            linkList.addField("There were no", "pending users!");
        } else {
            linkList.addField(`I found ${listEmpty.length}`, "pedning users!");
        }

        msg.author.send({ embeds: [linkList] });
    },
};