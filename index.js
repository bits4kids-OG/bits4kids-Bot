const Discord = require("discord.js");
const client = new Discord.Client();

const disbut = require("discord-buttons");
disbut(client);

const fetch = require("node-fetch");
const prefix = require('discord-prefix');

const config = require("./config.json");
const { version } = require("./package.json");
const fs = require("fs");


let connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
let buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));

const Blackjack = require("./blackjack");

const blackjackGames = {};
const invites = {};

let defaultPrefix = config.defaultPrefix;


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user
    .setPresence({ activity: { name: `-> ${defaultPrefix}help <-` }, status: "online" })
    .catch(console.error);
  
  client.guilds.cache.forEach(guild => {
    guild.fetchInvites().then(guildInvites => {
      invites[guild.id] = guildInvites;
    });
  });

});



client.on("guildMemberAdd", member => {
  //console.log("Now checking....");
  refreshFiles();
  member.guild.fetchInvites().then(guildInvites => {
    const old = invites[member.guild.id];
    invites[member.guild.id] = guildInvites;
    const invite = guildInvites.find(inv => old.get(inv.code).uses < inv.uses);
    const inviter = client.users.cache.get(invite.inviter.id);
    //console.log(invite);
    const logChannel = findLogChannel(member);
    logChannel?.send(`${member.user.tag} joined using invite code ${invite.code} from ${inviter.tag}. Invite was used ${invite.uses} times since its creation. This was the URL: ${invite.url}`);
    let roleList = "";
    for(key in connections[member.guild.id]) {
      //console.log(`Now checking ${key}`);
      if (key === invite.code) {
        for (let i = 0; i < connections[member.guild.id][key].connections.length; i++) {
          let role = member.guild.roles.cache.find(role => role.id === connections[member.guild.id][key].connections[i]);
          //console.log(connections[member.guild.id][key].connections[i]);
          //console.log(`Found the Role ${role}`);
          member.roles.add(role);
          roleList = roleList + role.name + "\n";
          logChannel?.send(`Added role ${role} to user ${member.user.tag}.`);
        }
      }
    }
    if (checkArrayEmpty(roleList) == true) {
      logChannel?.send(`No roles connected to this invite.`);
    }
  });
});


client.on('clickButton', async (button) => {
  refreshFiles();
  const logChannel = findLogChannel(button);
  logChannel?.send(`${button.clicker.user.tag} clicked button!`);
  //await button.reply.defer(true);
  await button.clicker.fetch();
  let roleList = "";
  let roleAlready = "";
  for(key in buttons[button.guild.id]) {
    if (key === button.id) {
      for (let i = 0; i < buttons[button.guild.id][key].buttons.length; i++) {
        let role = button.guild.roles.cache.find(role => role.id === buttons[button.guild.id][key].buttons[i]);
        if (!button.clicker.member.roles.cache.has(role.id)) {
          button.clicker.member.roles.add(role);
          roleList = roleList + role.name + "\n";
          logChannel?.send(`Added role ${role} to user ${button.clicker.user.tag}.`);
        } else {
          roleAlready = roleAlready + role.name + "\n";
        }

      }
    }
  }
  if ((checkArrayEmpty(roleList) == true) && (checkArrayEmpty(roleAlready) == true)) {
    await button.reply.send("Diesem Knopf wurden noch keine Rollen hinzugefügt!", true);
    logChannel?.send(`No roles connected to the button ${button.id}.`);
  } else if ((checkArrayEmpty(roleList) == true) && (checkArrayEmpty(roleAlready) == false)) {
    await button.reply.send("Du hast bereits alle Rollen!", true);
    logChannel?.send(`User already has all roles connected to the button ${button.id}.`);
  } else if ((checkArrayEmpty(roleList) == false) && (checkArrayEmpty(roleAlready) == false)) {
    await button.reply.send("Folgende Rollen wurden erfolgreich hinzugefügt: \n" + roleList + ":white_check_mark:" + "\nFolgende Rollen hast du bereits: \n" +roleAlready, true);
    logChannel?.send(`User already has the role(s): \n${roleAlready}Added role(s): \n${roleList}Connected to the button ${button.id}.`);
  } else {
  await button.reply.send("Folgende Rollen wurden erfolgreich hinzugefügt: \n" + roleList + ":white_check_mark:", true);
    logChannel?.send(`User didn't have any roles. Added roles: \n${roleList}Connected to the button ${button.id}.`);
    }
    //await button.reply.delete();
});



client.on("message", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.guild) {
    msg.reply("Entschuldigung, aber der Bot funktioniert nur in Servern.")
    return;
  }

  let guildPrefix = prefix.getPrefix(msg.guild.id);
  if (!guildPrefix) guildPrefix = defaultPrefix;

  if (!msg.content.startsWith(guildPrefix)) return;
  // Blacklist
  if (config.blacklist.includes(msg.author.id)) {
    msg.author.send("Das darfst du nicht machen!");
    return;
  }
  const args = msg.content.substr(guildPrefix.length).split(/ +/);
  const cmd = args.shift().toLowerCase();

  switch (cmd) {
    case "ping":
      msg.reply("Pong!");
      break;
    case "changepresence":
      if (config.owner.includes(msg.author.id)) {
        if (!args[0]) {
          msg.reply(`Correct usage: ${guildPrefix}changepresence <status (online, idle, ...)> <text that will be shown>`);
          return;
        }
        const status = args.shift().toLowerCase();
        client.user
          .setPresence({ activity: { name: args.join(" ") }, status: status })
          .catch(console.error);
      } else {
        msg.author.send("Das darfst du nicht machen!");
      }
      break;
    case "changeprefix":
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        msg.author.send("Das darfst du nicht machen!");
      }
      else if (!args[0] || args[0] === "help") {
        msg.reply(`Correct usage: ${guildPrefix}changeprefix <desired prefix>`);
      }
      else if (args[0].length >= 3) {
        msg.reply("Your prefix can't be longer than 3 characters!");
      }
      else {
        prefix.setPrefix(args[0], msg.guild.id);
        guildPrefix = prefix.getPrefix(msg.guild.id);
        msg.reply(`Prefix changed to ${guildPrefix}`);
      }
      break;
    case "katze":
      const catObj = await (await fetch("http://aws.random.cat/meow")).json();
      const embed = new Discord.MessageEmbed()
        .setColor(randomColor())
        .setTitle("Katze")
        .setImage(catObj.file)
        .setURL(catObj.file)
        .setFooter("Funktioniert mit random.cat");
      msg.reply(embed);
      break;
    case "about":
      msg.reply(
        `Hallo! Ich bin ein nützlicher Discord Bot, der vom Programmierer und Discord-Benutzer emeraldingg#2697 erstellt wurde. Mein aktueller Prefix ist ${guildPrefix}. Mit mir kannst du Katzenfotos bekommen, zufällige Zahlen erstellen und Blackjack spielen.\nIch hoffe du hast Spaß! Version: ${version}`
      );
      break;
    case "zufallszahl":
      if (!args[0] || isNaN(args[0])) {
        msg.reply(
          `Korrekte Benutzung: ${guildPrefix}zufallszahl <höchste Zahl> oder ${guildPrefix}zufallszahl <niedrigste Zahl> <höchste Zahl>`
        );
      } else if (!args[1] || isNaN(args[1])) {
        msg.reply(randomNumber(0, Math.round(args[0])));
      } else {
        msg.reply(randomNumber(Math.round(args[0]), Math.round(args[1])));
      }
      break;
    case "button":
      
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        msg.author.send("Das darfst du nicht machen!");
        break;
      }
    
      refreshFiles();

      let farben = ['blurple', 'grey', 'green', 'red', 'url']

      if (!args[0] || !args[1] || !args[2] || !args[3] || (args[0] != "url" && !args[4])) {

        if (args[0] === "list") {
          msg.reply("Sent you a DM!");
        const linkList = new Discord.MessageEmbed()
          .setColor(randomColor())
          .setTitle("Diese Buttons und Rollen wurden verbunden:")
          .setThumbnail(client.user.avatarURL());

          let roleEmpty = [];

          for(key in buttons[msg.guild.id]) {
            roleEmpty.push(key);
            let roleList = "";
            for (let i = 0; i < buttons[msg.guild.id][key].buttons.length; i++) {
              let role = msg.guild.roles.cache.find(role => role.id === buttons[msg.guild.id][key].buttons[i]);
              roleList = roleList + role.name + "\n"
            }
            linkList.addField(key, roleList);
          }

          if (checkArrayEmpty(roleEmpty) == true) {
            linkList.addField("I found no connected elements", "in my Files!")
          } else {
            linkList.addField(`I found ${roleEmpty.length} connected button(s)`, `in my Files!`)
          }

          msg.author.send("", { embed: linkList });
          break;
        }


          if ((args[1]) && (args[1] === "unset")) {
            let buttonsID = args[0];
            if (buttonsID == null || !buttons[msg.guild.id][buttonsID]) {
              msg.reply("Warning! No ID found.");
              break;
            }
            if (buttons[msg.guild.id][buttonsID]) {
              delete(buttons[msg.guild.id][buttonsID]);
              fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
                if(err) console.log(err)
              });
              msg.reply(`Succesfully removed the Button ${buttonsID} and connected Role(s)!`);
              break;
            } else {
                msg.reply("Sorry, but I couldn't find that Button in my Files.");
                break;
            }
          }
    
    

          
          if ((args[2]) && (args[2] === "unset")) {
            let buttonsID = args[0];
            if (buttonsID == null || !buttons[msg.guild.id][buttonsID]) {
              msg.reply("Warning! No ID found.");
              break;
            }
            let buttonsRole = getRole(msg.member, args[1]);
            if (buttonsRole == null) {
              msg.reply("Warning! No role found.");
              break;
            }
            if ((buttons[msg.guild.id][buttonsID]) && (buttons[msg.guild.id][buttonsID].buttons.includes(buttonsRole.id))) {
              for (let i = 0; i < buttons[msg.guild.id][buttonsID].buttons.length; i++) {
                if (buttons[msg.guild.id][buttonsID].buttons[i] === buttonsRole.id) {
                  buttons[msg.guild.id][buttonsID].buttons.splice(i,1);
                }
              }
              fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
                if(err) console.log(err)
              });
              msg.reply(`Succesfully removed the connected Role ${buttonsRole}!`);
              break;
            } else {
              msg.reply("Sorry, but I couldn't find that Button in my Files.");
              break;
            }
          }

          if ((args[2]) && (args[2] === "connect")) {
            let buttonsID = args[0];
            if (buttonsID == null || !buttons[msg.guild.id][buttonsID]) {
              msg.reply("Warning! No ID found.");
              break;
            }
            let buttonsRole = getRole(msg.member, args[1]);
            if (buttonsRole == null) {
              msg.reply("Warning! No role found.");
              break;
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
                break;
              }
            }
                buttons[msg.guild.id][buttonsID].buttons.push(buttonsRole.id);
                fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
                  if(err) console.log(err)
                });
                msg.reply(`Succesfully connected the Button ${buttonsID} and Role ${buttonsRole}!`);
                break;
          }

        msg.reply(`Correct usage: ${guildPrefix}button create <id> <color> <text_on_button> <text in message> or ${guildPrefix}button <id> <desired role to connect> <color> <text_on_button> <text in message> or ${guildPrefix}button <id> <desired role to connect> connect or ${guildPrefix}button <id> unset or ${guildPrefix}button <id> <role> unset or ${guildPrefix}button url <desired link> <text_on_button> <text in message>`);
        break;
      }


      if (args[0] === "create") {
        if (!farben.includes(args[2])) {
          msg.reply("This style is not supported!");
          break;
        } else {
            let buttonsID = args[1];
            let buttonsColor = args[2];
            let buttonText = args[3]
              .split("_").join(" ");
            let msgText = args
              .slice(4)
              .join(" ");
  
          let button = new disbut.MessageButton()
            .setStyle(buttonsColor)
            .setID(buttonsID)
            .setLabel(buttonText);
          
          msg.channel.send(msgText, button);

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
              break;
            }
          }

          fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
            if(err) console.log(err)
          });
          msg.reply(`Succesfully created the Button ${buttonsID}!`);
          break;

      }
    }


      let buttonsColor = args[0];
      let buttonsID = args[1];
      let buttonText = args[2]
        .split("_").join(" ");
      let msgText = args
        .slice(3)
        .join(" ");

      if (args[0] === "url") {
        if (!buttonsID.includes("https") && !buttonsID.includes("http") && !buttonsID.includes("discord")) {
          msg.reply(`Correct usage: ${guildPrefix}button create <id> <color> <text_on_button> <text in message> or ${guildPrefix}button <id> <desired role to connect> <color> <text_on_button> <text in message> or ${guildPrefix}button <id> <desired role to connect> connect or ${guildPrefix}button <id> unset or ${guildPrefix}button <id> <role> unset or ${guildPrefix}button url <desired link> <text_on_button> <text in message>`);
          break;
        }

        let button = new disbut.MessageButton()  
          .setStyle(buttonsColor)
          .setURL(buttonsID) 
          .setLabel(buttonText);

        msg.channel.send(msgText, button);
      } else if (!farben.includes(args[2])) {
        msg.reply("This style is not supported!");
        break;
      } else {
          let buttonsID = args[0];
          let buttonsRole = getRole(msg.member, args[1]);
          if (buttonsRole == null) {
            msg.reply("Warning! No role found.");
            break;
          }
          let buttonsColor = args[2];
          let buttonText = args[3]
            .split("_").join(" ");
          let msgText = args
            .slice(4)
            .join(" ");

        let button = new disbut.MessageButton()
          .setStyle(buttonsColor)
          .setID(buttonsID)
          .setLabel(buttonText);
        
        msg.channel.send(msgText, button);
      

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
            break;
          }
        }
            buttons[msg.guild.id][buttonsID].buttons.push(buttonsRole.id);
            fs.writeFile("./buttons.json", JSON.stringify(buttons, null, 2), err => {
              if(err) console.log(err)
            });
            msg.reply(`Succesfully connected the Button ${buttonsID} and Role ${buttonsRole}!`);
    }  
      break;
    case "inviteconnect":
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        msg.author.send("Das darfst du nicht machen!");
      }
      else if (!args[0] || !args[1] || getInviteCode(args[0]) == null) {

        refresh(msg);

        if (args[0] === "list") {
          msg.reply("Sent you a DM!");
        const linkList = new Discord.MessageEmbed()
          .setColor(randomColor())
          .setTitle("Diese Invites und Rollen wurden verbunden:")
          .setThumbnail(client.user.avatarURL());

          let roleEmpty = [];

          for(key in connections[msg.guild.id]) {
            roleEmpty.push(key);
            let roleList = "";
            for (let i = 0; i < connections[msg.guild.id][key].connections.length; i++) {
              let role = msg.guild.roles.cache.find(role => role.id === connections[msg.guild.id][key].connections[i]);
              roleList = roleList + role.name + "\n"
            }
            linkList.addField("https://discord.gg/" + key + ":", roleList);
          }

          if (checkArrayEmpty(roleEmpty) == true) {
            linkList.addField("I found no connected elements", "in my Files!")
          } else {
            linkList.addField(`I found ${roleEmpty.length} connected Link(s)`, `in my Files!`)
          }

          msg.author.send("", { embed: linkList });
          break;

        } else {
        msg.reply(`Correct usage: ${guildPrefix}inviteconnect <Invite URL or Code> <Name of the role> or ${guildPrefix}inviteconnect <Invite URL or Code> <Connected Role> unset or ${guildPrefix}inviteconnect <Invite URL or Code> unset or ${guildPrefix}inviteconnect list`)
        }
      } else if (args[2] && args[2] != "unset") {
        msg.reply(`The role can only be 1 argument -> No spaces\nCorrect usage: ${guildPrefix}inviteconnect <Invite URL or Code> <Name of the role> or ${guildPrefix}inviteconnect <Invite URL or Code> <Connected Role> unset or ${guildPrefix}inviteconnect <Invite URL or Code> unset or ${guildPrefix}inviteconnect list`)
      } else {
        let connectionsLinks = getInviteCode(args[0]);

        if (connectionsLinks == null) {
          msg.reply("Warning! No Link found.");
          break;
        }

        if ((args[1]) && (args[1] === "unset")) {
          if (connections[msg.guild.id][connectionsLinks]) {
            delete(connections[msg.guild.id][connectionsLinks]);
            fs.writeFile("./connections.json", JSON.stringify(connections, null, 2), err => {
              if(err) console.log(err)
            });
            msg.reply(`Succesfully removed the Link ${connectionsLinks} and connected Role(s)!`);
            break;
          } else {
              msg.reply("Sorry, but I couldn't find that Link in my Files.");
              break;
          }
        }

        if (!invites[msg.guild.id].has(connectionsLinks)) {
          msg.reply("Warning! No Link found.");
          break;
        }

        let connectionsRole = getRole(msg.member, args[1]);
        if (connectionsRole == null) {
          msg.reply("Warning! No role found.");
          break;
        }
        
        if ((args[2]) && (args[2] === "unset")) {
          if ((connections[msg.guild.id][connectionsLinks]) && (connections[msg.guild.id][connectionsLinks].connections.includes(connectionsRole.id))) {
            for (let i = 0; i < connections[msg.guild.id][connectionsLinks].connections.length; i++) {
              if (connections[msg.guild.id][connectionsLinks].connections[i] === connectionsRole.id) {
                connections[msg.guild.id][connectionsLinks].connections.splice(i,1);
              }
            }
            fs.writeFile("./connections.json", JSON.stringify(connections, null, 2), err => {
              if(err) console.log(err)
            });
            msg.reply(`Succesfully removed the connected Role ${connectionsRole}!`);
            break;
          } else {
            msg.reply("Sorry, but I couldn't find that Link in my Files.");
            break;
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
            break;
          }
        }
            connections[msg.guild.id][connectionsLinks].connections.push(connectionsRole.id);
            fs.writeFile("./connections.json", JSON.stringify(connections, null, 2), err => {
              if(err) console.log(err)
            });
            msg.reply(`Succesfully connected the Link ${connectionsLinks} and Role ${connectionsRole}!`);
      }
    }
      break;
    case "help":
    
    if (args[0] && args[0] === "admin") {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        msg.author.send("Das darfst du nicht machen!");
        break;
      }
      msg.reply("Sent you a DM!");
      const help = new Discord.MessageEmbed()
        .setColor(randomColor())
        .setTitle(`Admin-Hilfe für den bits4kids Bot: (Für normale Commands -> ${guildPrefix}help`)
        .setThumbnail(client.user.avatarURL())
        .addField(
          `${guildPrefix}refresh`,
          `Wenn neue Invites erstellt werden, muss dieser Command ausgeführt werden, bevor man eine Rolle verbinden kann. Der Command muss auch ausgeführt werden, wenn eine Datei für die Invitelinks oder Buttons verändert wurde. Benötigt die Berechtigung "Manage Server".`
        )
        .addField(
          `${guildPrefix}inviteconnect`,
          `Verknüpft einen Invite-Link oder nur den Code mit einer Rolle. Entweder den Namen der Rolle eingeben, oder die ID kopieren. Joint jemand mit diesem Invite, bekommt er automatisch die richtige Rolle zugewiesen. Benötigt die Berechtigung "Manage Server".`
        )
        .addField(`${guildPrefix}help admin`, `Lädt diese Seite. Benötigt die Berechtigung "Manage Server".`)
        .addField(`${guildPrefix}reboot`, `Startet den Bot neu. Benötigt die Berechtigung "Owner" -> emeraldingg anschreiben`)
        //.addField(`${guildPrefix}changeprefix`, `Ändert den Prefix des Bots. Du benötigst die Berichtigung, den Server zu verwalten.`)
        .addField(
          `${guildPrefix}announce`,
          `Schreibt auf jeden Server eine Nachricht, auf der der Bot drauf ist. Benötigt die Berechtigung "Owner" -> emeraldingg anschreiben`
        )
        
        .addField(`${guildPrefix}button`, `Erstellt und Verknüpft einen Button mit einer Rolle. Benötigt die Berechtigung "Manage Server".`)
        //.addField(
        //  `${guildPrefix}invite`,
        //  `Shows the invite link for this bot.`
        //)
        //.addField(`${guildPrefix}serverinvite`, `Erstellt einen Serverinvite und schickt ihn per DM.`)
        .addField(`${guildPrefix}changePresence`, `Ändert den Status des Bots (sieht man auf der Seite). Wird nach einem Neustart zurückgesetzt und gilt für alle Server. Benötigt die Berechtigung "Owner" -> emeraldingg anschreiben`)
        .addField(`${guildPrefix}changePrefix`, `Ändert den Prefix für den aktuellen Server. Die Hilfeseiten werden angepasst. Benötigt die Berechtigung "Manage Server".`);
      msg.author.send("", { embed: help });
      break;
    }
    
    msg.reply("Hier findest du die Hilfe:");
      const help = new Discord.MessageEmbed()
        .setColor(randomColor())
        .setTitle("Hilfe für den bits4kids Bot:")
        .setThumbnail(client.user.avatarURL())
        .addField(
          `${guildPrefix}blackjack`,
          `Spiele Blackjack mit dem Bot als Dealer.`
        )
        .addField(`${guildPrefix}help`, `Lädt diese Seite.`)
        .addField(`${guildPrefix}about`, `Zeigt Informationen zu diesem Bot.`)
        //.addField(`${guildPrefix}changeprefix`, `Ändert den Prefix des Bots. Du benötigst die Berichtigung, den Server zu verwalten.`)
        .addField(
          `${guildPrefix}zufallszahl`,
          `Erstellt eine Zufallszahl. Korrekte Benutzung: ${guildPrefix}zufallszahl <höchste Zahl> oder ${guildPrefix}zufallszahl <niedrigste Zahl> <höchste Zahl>`
        )
        .addField(
          `${guildPrefix}katze`,
          `Zeigt eine zufällige Katze von www.random.cat. an.`
        )
        .addField(`${guildPrefix}ping`, `Der Bot antwortet mit Pong.`)
        //.addField(
        //  `${guildPrefix}invite`,
        //  `Shows the invite link for this bot.`
        //)
        //.addField(`${guildPrefix}serverinvite`, `Erstellt einen Serverinvite und schickt ihn per DM.`)
        .addField(`${guildPrefix}stats`, `Zeigt ein paar Statistiken zum Bot.`);
      msg.reply("", { embed: help });
      break;
    //case "serverinvite":
    //  if (msg.guild && msg.member.hasPermission("CREATE_INSTANT_INVITE")) {
    //    serverInvite(msg);
    //    msg.reply("Sent you a DM!");
    //  } else {
    //    msg.reply("Sorry, but you don't have the permission to do that.");
    //  }
    //  break;
    case "stats":
      var seconds = process.uptime();
      days = Math.floor(seconds / 86400);
      seconds %= 86400;
      hrs = Math.floor(seconds / 3600);
      seconds %= 3600;
      mins = Math.floor(seconds / 60);
      secs = seconds % 60;
      var uptime =
        days +
        " Tage, " +
        hrs +
        " Stunden, " +
        mins +
        " Minuten und " +
        Math.round(secs) +
        " Sekunden";

      const stats = new Discord.MessageEmbed()
        .setColor(randomColor())
        .setTitle("Statistiken für den bits4kids-Bot:")
        .setDescription(
          `Hallo! Ich bin ein nützlicher Discord Bot, der vom Programmierer und Discord-Benutzer emeraldingg#2697 erstellt wurde. Mein aktueller Prefix ist ${guildPrefix}. Mit mir kannst du Katzenfotos bekommen, zufällige Zahlen erstellen und Blackjack spielen.\nIch hoffe du hast Spaß! Version: ${version}`
        )
        .setThumbnail(client.user.avatarURL())
        .addField("Ersteller:", "emeraldingg#2697")
        //.addField("Invite:", `[Click Here](${config.invite})`)
        .addField("Anzahl an Servern", client.guilds.cache.size)
        .addField("Kanäle", client.channels.cache.size)
        .addField("Anzahl an Benutzern", client.users.cache.size)
        .addField("Uptime", uptime)
        .addField(
          "RAM Benutzung",
          Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB"
        );
      msg.reply("", { embed: stats });
      break;
    case "announce":
      if (config.owner.includes(msg.author.id)) {
        if (!args[0]) return;
        const text = args.join(" ");
        let errorGuilds = [];
        client.guilds.cache.forEach((guild) => {
          const channel = findGoodChannel(guild);
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
      break;
    case "reboot":
      if (config.owner.includes(msg.author.id)) {
        msg.reply("Restarting!").then(function () {
          console.log("Restarted by " + msg.author.tag);
          process.exit(0);
        });
      } else {
        msg.author.send("Das darfst du nicht machen!");
      }
      break;
    case "refresh":
    if (!msg.member.hasPermission("MANAGE_GUILD")) {
      msg.author.send("Das darfst du nicht machen!");
    } else {
      refresh(msg);
      msg.reply("Successfully refreshed the invites and files!");
    }
      break;
    case "blackjack":
      if (blackjackGames[msg.author.id]) {
        if (args[0] && args[0] === "end") {
          blackjackGames[msg.author.id].end();
        } else {
          msg.reply("Du spielst bereits Blackjack!");
        }
      } else {
        if (!args[0]) {
          blackjackGames[msg.author.id] = new Blackjack(msg, () => {
          delete blackjackGames[msg.author.id];
        });
        blackjackGames[msg.author.id].start();
        } else {
          msg.reply("Falsche Benutzung!");
        }
      }
      break;
  }
});

client.on("guildCreate", async (guild) => {
  const channel = findGoodChannel(guild);
  let guildPrefix = prefix.getPrefix(guild.id);
  if (!guildPrefix) guildPrefix = defaultPrefix;
  if (channel) {
    channel.send(
      `Hallo! Ich bin ein nützlicher Discord Bot, der vom Programmierer und Discord-Benutzer emeraldingg#2697 erstellt wurde. Mein aktueller Prefix ist ${guildPrefix}. Mit mir kannst du Katzenfotos bekommen, zufällige Zahlen erstellen und Blackjack spielen.\nIch hoffe du hast Spaß! Version: ${version}`
      );
  }
});

client.login(config.tokenReal);

function findGoodChannel(guild) {
  return guild.channels.cache
    .filter((channel) => {
      if (channel.type !== "text") return false;
      return channel
        .permissionsFor(guild.me)
        .has(Discord.Permissions.FLAGS.SEND_MESSAGES);
    })
    .first();
}
const inviteCodeReg = /^[a-z0-9]+$/i;

function getInviteCode(inviteCode) {
  inviteCode = inviteCode.replace("https://discord.gg/", "").replace("https://discordapp.com/invite/", "").replace("https://discord.com/invite/", "");
  if (!inviteCodeReg.test(inviteCode)) return null;
  return inviteCode;
}

function getRole(member, roleName) {
  let role;
  if (Number.isNaN(+roleName)) {
    role = member.guild.roles.cache.find(role => role.name === roleName);
  } else {
    role = member.guild.roles.cache.find(role => role.id === roleName);
  }
  if (!role) return null;
  return role;
}

function refresh(msg) {
    msg.guild.fetchInvites().then(guildInvites => {
      invites[msg.guild.id] = guildInvites;
    });
  connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
  buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));
}

function refreshFiles() {
  connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
  buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));
}

function checkArrayEmpty(array) {
  if (array.length === 0) {
    return true;
  } else {
    return false;
  }
}

function findLogChannel(msg) {
  let logChannel = msg.guild.channels.cache.find(channel => channel.name === "log");
  if ((logChannel) && (((logChannel.permissionsFor(msg.guild.me).has("VIEW_CHANNEL")) == false) || ((logChannel.permissionsFor(msg.guild.me).has("SEND_MESSAGES")) == false))) {
    logChannel = null;
  }
  return logChannel;
}

function randomColor() {
  return Math.floor(Math.random() * 16777215);
}
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function serverInvite(msg) {
  let invite = await msg.channel.createInvite(
    {
      maxAge: 1800 * 1,
      maxUses: 1,
    },
    `Requested by ${msg.author.tag}`
  );
  msg.author.send(invite ? `Here's your server invite: ${invite}` : "Error!");
}
