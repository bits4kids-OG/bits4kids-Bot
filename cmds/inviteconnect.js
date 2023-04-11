const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const utils = require('../utils.js');
const fs = require("fs");

let connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));

module.exports = {
	data: new SlashCommandBuilder()
		.setName("inviteconnect")
		.setDescription("Tool to create/manage invite Links that will be assigned to a role"),
	execute(msg, args, client, guildPrefix, invites) {
        if (!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)) {
            msg.author.send("Das darfst du nicht machen!");
          } else if (!args[0] || !args[1] || utils.getInviteCode(args[0]) == null) {
            refresh(msg);
    
            if (args[0] === "list") {
              msg.reply("Sent you a DM!");
            const linkList = new Discord.MessageEmbed()
              .setColor(utils.randomColor())
              .setTitle("Diese Invites und Rollen wurden verbunden:")
              .setThumbnail(client.user.avatarURL());
    
              let roleEmpty = [];
    
              for(const key in connections[msg.guild.id]) {
                roleEmpty.push(key);
                let roleList = "";
                for (let i = 0; i < connections[msg.guild.id][key].connections.length; i++) {
                  let role = msg.guild.roles.cache.find(role => role.id === connections[msg.guild.id][key].connections[i]);
                  roleList = roleList + role.name + "\n"
                }
                if(roleList === "") {
                  roleList = "No role connected!";
                }
                linkList.addField("https://discord.gg/" + key + ":", roleList);
              }
    
              if (utils.checkArrayEmpty(roleEmpty) == true) {
                linkList.addField("I found no connected elements", "in my Files!")
              } else {
                linkList.addField(`I found ${roleEmpty.length} connected Link(s)`, `in my Files!`)
              }
    
              msg.author.send({ embeds: [linkList] });
              return;
    
            } else {
            msg.reply(`Correct usage: ${guildPrefix}inviteconnect <Invite URL or Code> <Name of the role> or ${guildPrefix}inviteconnect <Invite URL or Code> <Connected Role> unset or ${guildPrefix}inviteconnect <Invite URL or Code> unset or ${guildPrefix}inviteconnect list`)
            }
          } else if (args[2] && args[2] != "unset") {
            msg.reply(`The role can only be 1 argument -> No spaces\nCorrect usage: ${guildPrefix}inviteconnect <Invite URL or Code> <Name of the role> or ${guildPrefix}inviteconnect <Invite URL or Code> <Connected Role> unset or ${guildPrefix}inviteconnect <Invite URL or Code> unset or ${guildPrefix}inviteconnect list`)
          } else {
            refresh(msg);
            let connectionsLinks = utils.getInviteCode(args[0]);
    
            if (connectionsLinks == null) {
              msg.reply("Warning! No Link found.");
              return;
            }
    
            if ((args[1]) && (args[1] === "unset")) {
              if (connections[msg.guild.id][connectionsLinks]) {
                delete(connections[msg.guild.id][connectionsLinks]);
                fs.writeFile("./connections.json", JSON.stringify(connections, null, 2), err => {
                  if(err) console.log(err);
                  else msg.reply(`Succesfully removed the Link ${connectionsLinks} and connected Role(s)!`);
                });
                return;
              } else {
                  msg.reply("Sorry, but I couldn't find that Link in my Files.");
                  return;
              }
            }
    
            if (!invites[msg.guild.id].has(connectionsLinks)) {
              msg.reply("Warning! No Link found.");
              return;
            }
    
            let connectionsRole = utils.getRole(msg.member, args[1]);
            if (connectionsRole == null) {
              msg.reply("Warning! No role found.");
              return;
            }
            
            if ((args[2]) && (args[2] === "unset")) {
              if ((connections[msg.guild.id][connectionsLinks]) && (connections[msg.guild.id][connectionsLinks].connections.includes(connectionsRole.id))) {
                for (let i = 0; i < connections[msg.guild.id][connectionsLinks].connections.length; i++) {
                  if (connections[msg.guild.id][connectionsLinks].connections[i] === connectionsRole.id) {
                    connections[msg.guild.id][connectionsLinks].connections.splice(i,1);
                  }
                }
                fs.writeFile("./connections.json", JSON.stringify(connections, null, 2), err => {
                  if(err) console.log(err);
                  else msg.reply(`Succesfully removed the connected Role ${connectionsRole}!`);
                });
                return;
              } else {
                msg.reply("Sorry, but I couldn't find that Link in my Files.");
                return;
              }
            } else {
            if (!connections[msg.guild.id]) {
              connections[msg.guild.id] = {};
              connections[msg.guild.id][connectionsLinks] = {};
              connections[msg.guild.id][connectionsLinks].connections = [];
            } else {
              if ((!connections[msg.guild.id][connectionsLinks]) || (!connections[msg.guild.id][connectionsLinks].connections) || (!connections[msg.guild.id][connectionsLinks].connections.includes(connectionsRole.id))) {
                if (!connections[msg.guild.id][connectionsLinks]) {
                  connections[msg.guild.id][connectionsLinks] = {};
                }
                if (!connections[msg.guild.id][connectionsLinks].connections) {
                  connections[msg.guild.id][connectionsLinks].connections = [];
                }
    
              } else {
                msg.reply("Sorry, but that Link is already connected. Try unsetting it first.");
                return;
              }
            }
                connections[msg.guild.id][connectionsLinks].connections.push(connectionsRole.id);
                fs.writeFile("./connections.json", JSON.stringify(connections, null, 2), err => {
                  if(err) console.log(err);
                  else msg.reply(`Succesfully connected the Link ${connectionsLinks} and Role ${connectionsRole}!`);
                });
          }
        }
        function refresh(msg) {
            msg.guild.invites.fetch().then(guildInvites => {
              invites[msg.guild.id] = guildInvites;
            });
          connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
          buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));
        }
	},
};