const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");
const fs = require("fs");

let buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));

module.exports = {
    data: new SlashCommandBuilder()
        .setName("button")
        .setDescription("Tool for creating/managing buttons."),
    execute(msg, args, client, guildPrefix) {
        if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) {
            msg.author.send("Das darfst du nicht machen!");
            return;
        }
        
        refreshFiles();

        let farben = ["Primary", "Secondary", "Success", "Danger", "Link"];
    
        if (!args[0] || !args[1] || !args[2] || !args[3] || (((args[0] != "Link") && (args[0] != "leaderboard")) && !args[4])) {
    
            if (args[0] === "list") {
                msg.reply("Sent you a DM!");
                const linkList = new Discord.EmbedBuilder()
                    .setColor(utils.randomColor())
                    .setTitle("Diese Buttons und Rollen wurden verbunden:")
                    .setThumbnail(client.user.avatarURL());
    
                let roleEmpty = [];
    
                for(const key in buttons[msg.guild.id]) {
                    roleEmpty.push(key);
                    let roleList = "";
                    for (let i = 0; i < buttons[msg.guild.id][key].buttons.length; i++) {
                        let role = msg.guild.roles.cache.find(role => role.id === buttons[msg.guild.id][key].buttons[i]);
                        roleList = roleList + role.name + "\n";
                    }
                    if(roleList === "") {
                        roleList = "No role connected!";
                    }
                    linkList.addFields({name: key, value: roleList});
                }
    
                if (utils.checkArrayEmpty(roleEmpty) == true) {
                    linkList.addFields({ name: "I found no connected elements", value: "in my Files!"});
                } else {
                    linkList.addFields({ name: `I found ${roleEmpty.length} connected button(s)`, value: "in my Files!"});
                }
    
                msg.author.send({ embeds: [linkList] });
                return;
            }
    
    
            if ((args[1]) && (args[1] === "unset")) {
                let buttonsID = args[0];
                if((buttonsID === "optinLB") || (buttonsID === "optoutLB")) {
                    msg.reply("This ID is reserved for the leaderboard optin/optout system!");
                    return;
                }
                if (buttonsID == null || !buttons[msg.guild.id][buttonsID]) {
                    msg.reply("Warning! No ID found.");
                    return;
                }
                if (buttons[msg.guild.id][buttonsID]) {
                    delete(buttons[msg.guild.id][buttonsID]);
                    fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
                        if(err) console.log(err);
                        else msg.reply(`Succesfully removed the Button ${buttonsID} and connected Role(s)!`);
                    });
                    return;
                } else {
                    msg.reply("Sorry, but I couldn't find that Button in my Files.");
                    return;
                }
            }
        
        
    
              
            if ((args[2]) && (args[2] === "unset")) {
                let buttonsID = args[0];
                if((buttonsID === "optinLB") || (buttonsID === "optoutLB")) {
                    msg.reply("This ID is reserved for the leaderboard optin/optout system!");
                    return;
                }
                if (buttonsID == null || !buttons[msg.guild.id][buttonsID]) {
                    msg.reply("Warning! No ID found.");
                    return;
                }
                let buttonsRole = utils.getRole(msg.member, args[1]);
                if (buttonsRole == null) {
                    msg.reply("Warning! No role found.");
                    return;
                }
                if ((buttons[msg.guild.id][buttonsID]) && (buttons[msg.guild.id][buttonsID].buttons.includes(buttonsRole.id))) {
                    for (let i = 0; i < buttons[msg.guild.id][buttonsID].buttons.length; i++) {
                        if (buttons[msg.guild.id][buttonsID].buttons[i] === buttonsRole.id) {
                            buttons[msg.guild.id][buttonsID].buttons.splice(i,1);
                        }
                    }
                    fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
                        if(err) console.log(err);
                        else msg.reply(`Succesfully removed the connected Role ${buttonsRole}!`);
                    });
                    return;
                } else {
                    msg.reply("Sorry, but I couldn't find that Button in my Files.");
                    return;
                }
            }
    
            if ((args[2]) && (args[2] === "connect")) {
                let buttonsID = args[0];
                if((buttonsID === "optinLB") || (buttonsID === "optoutLB")) {
                    msg.reply("This ID is reserved for the leaderboard optin/optout system!");
                    return;
                }
                if (buttonsID == null || !buttons[msg.guild.id][buttonsID]) {
                    msg.reply("Warning! No ID found.");
                    return;
                }
                let buttonsRole = utils.getRole(msg.member, args[1]);
                if (buttonsRole == null) {
                    msg.reply("Warning! No role found.");
                    return;
                }
    
                if (!buttons[msg.guild.id]) {
                    buttons[msg.guild.id] = {};
                    buttons[msg.guild.id][buttonsID] = {};
                    buttons[msg.guild.id][buttonsID].buttons = [];
                } else {
                    if ((!buttons[msg.guild.id][buttonsID]) || (!buttons[msg.guild.id][buttonsID].buttons) || (!buttons[msg.guild.id][buttonsID].buttons.includes(buttonsRole.id))) {
                        if (!buttons[msg.guild.id][buttonsID]) {
                            buttons[msg.guild.id][buttonsID] = {};
                        }
                        if (!buttons[msg.guild.id][buttonsID].buttons) {
                            buttons[msg.guild.id][buttonsID].buttons = [];
                        }
          
                    } else {
                        msg.reply("Sorry, but that Button is already connected. Try unsetting it first.");
                        return;
                    }
                }
                buttons[msg.guild.id][buttonsID].buttons.push(buttonsRole.id);
                fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
                    if(err) console.log(err);
                    else msg.reply(`Succesfully connected the Button ${buttonsID} and Role ${buttonsRole}!`);
                });
                return;
            }
    
            msg.reply(`Correct usage: ${guildPrefix}button create <id> <color> <text_on_button> <text in message> or ${guildPrefix}button <id> <desired role to connect> <color> <text_on_button> <text in message> or ${guildPrefix}button <id> <desired role to connect> connect or ${guildPrefix}button <id> unset or ${guildPrefix}button <id> <role> unset or ${guildPrefix}button url <desired link> <text_on_button> <text in message> or ${guildPrefix}button leaderboard <text_on_button1> <text_on_button2> <text in message>`);
            return;
        }
    
        if(args[0] === "leaderboard") {
            let buttonTextYes = args[1]
                .split("_").join(" ");
            let buttonTextNo = args[2]
                .split("_").join(" ");
            let msgText = args
                .slice(3)
                .join(" ");
  
            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Success)
                        .setCustomId("optinLB")
                        .setLabel(buttonTextYes)
                )
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Danger)
                        .setCustomId("optoutLB")
                        .setLabel(buttonTextNo)
                );
            msg.channel.send({ content: msgText, components: [row] });
            msg.delete();
            return;
        } else if (args[0] === "create") {
            if (!farben.includes(args[2])) {
                msg.reply("This style is not supported! Correct Styles: Primary, Secondary, Success, Danger, Link");
                return;
            } else {
                let buttonsID = args[1];
                if((buttonsID === "optinLB") || (buttonsID === "optoutLB")) {
                    msg.reply("This ID is reserved for the leaderboard optin/optout system!");
                    return;
                }
                let buttonsColor = args[2];
                let buttonText = args[3]
                    .split("_").join(" ");
                let msgText = args
                    .slice(4)
                    .join(" ");
      
                const row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle[buttonsColor])
                            .setCustomId(buttonsID)
                            .setLabel(buttonText)
                    );
                msg.channel.send({ content: msgText, components: [row] });
    
                if (!buttons[msg.guild.id]) {
                    buttons[msg.guild.id] = {};
                    buttons[msg.guild.id][buttonsID] = {};
                    buttons[msg.guild.id][buttonsID].buttons = [];
                } else {
                    if ((!buttons[msg.guild.id][buttonsID]) || (!buttons[msg.guild.id][buttonsID].buttons)) {
                        if (!buttons[msg.guild.id][buttonsID]) {
                            buttons[msg.guild.id][buttonsID] = {};
                        }
                        if (!buttons[msg.guild.id][buttonsID].buttons) {
                            buttons[msg.guild.id][buttonsID].buttons = [];
                        }
        
                    } else {
                        msg.reply("Though that Button is already connected, I still created a new one with the same connections.");
                        return;
                    }
                }
    
                fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
                    if(err) console.log(err);
                    else msg.reply(`Succesfully created the Button ${buttonsID}!`);
                });
                return;
    
            }
        }
    
    
        let buttonsColor = args[0];
        let buttonsID = args[1];
        if((buttonsID === "optinLB") || (buttonsID === "optoutLB")) {
            msg.reply("This ID is reserved for the leaderboard optin/optout system!");
            return;
        }
        let buttonText = args[2]
            .split("_").join(" ");
        let msgText = args
            .slice(3)
            .join(" ");
    
        if (args[0] === "url") {
            if (!buttonsID.includes("https") && !buttonsID.includes("http") && !buttonsID.includes("discord")) {
                msg.reply(`Correct usage: ${guildPrefix}button create <id> <color> <text_on_button> <text in message> or ${guildPrefix}button <id> <desired role to connect> <color> <text_on_button> <text in message> or ${guildPrefix}button <id> <desired role to connect> connect or ${guildPrefix}button <id> unset or ${guildPrefix}button <id> <role> unset or ${guildPrefix}button url <desired link> <text_on_button> <text in message> or ${guildPrefix}button leaderboard <text_on_button1> <text_on_button2> <text in message>`);
                return;
            }
            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle[buttonsColor])
                        .setURL(buttonsID)
                        .setLabel(buttonText)
                );
            msg.channel.send({ content: msgText, components: [row] });
    
        } else if (!farben.includes(args[2])) {
            msg.reply("This style is not supported! Correct Styles: Primary, Secondary, Success, Danger, Link");
            return;
        } else {
            let buttonsID = args[0];
            if((buttonsID === "optinLB") || (buttonsID === "optoutLB")) {
                msg.reply("This ID is reserved for the leaderboard optin/optout system!");
                return;
            }
            let buttonsRole = utils.getRole(msg.member, args[1]);
            if (buttonsRole == null) {
                msg.reply("Warning! No role found.");
                return;
            }
            let buttonsColor = args[2];
            let buttonText = args[3]
                .split("_").join(" ");
            let msgText = args
                .slice(4)
                .join(" ");
    
            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle[buttonsColor])
                        .setCustomId(buttonsID)
                        .setLabel(buttonText)
                );
            msg.channel.send({ content: msgText, components: [row] });
          
    
            if (!buttons[msg.guild.id]) {
                buttons[msg.guild.id] = {};
                buttons[msg.guild.id][buttonsID] = {};
                buttons[msg.guild.id][buttonsID].buttons = [];
            } else {
                if ((!buttons[msg.guild.id][buttonsID]) || (!buttons[msg.guild.id][buttonsID].buttons) || (!buttons[msg.guild.id][buttonsID].buttons.includes(buttonsRole.id))) {
                    if (!buttons[msg.guild.id][buttonsID]) {
                        buttons[msg.guild.id][buttonsID] = {};
                    }
                    if (!buttons[msg.guild.id][buttonsID].buttons) {
                        buttons[msg.guild.id][buttonsID].buttons = [];
                    }
      
                } else {
                    msg.reply("Though that Button is already connected, I still created a new one with the same connections.");
                    return;
                }
            }
            buttons[msg.guild.id][buttonsID].buttons.push(buttonsRole.id);
            fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
                if(err) console.log(err);
                else msg.reply(`Succesfully connected the Button ${buttonsID} and Role ${buttonsRole}!`);
            });
        }
        function refreshFiles() {
            buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));
        }
    },
};