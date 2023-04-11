const Discord = require("discord.js");

const myIntents = new Discord.Intents();
myIntents.add(Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_INVITES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILDS);

const client = new Discord.Client({ intents: myIntents });

const prefix = require('discord-prefix');

const config = require("./config.json");
const { version } = require("./package.json");
const fs = require("fs");

const utils = require('./utils.js');
const xp_levels = require("./xp-and-levels.js");

let connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
let buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));

const invites = {};
let fromWhere = {};

let defaultPrefix = config.defaultPrefix;


client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./cmds').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./cmds/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

//Login

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user
    .setPresence({ activities: [{ name: `-> ${defaultPrefix}help <-` }], status: "online" });
  
  client.guilds.cache.forEach(guild => {
    guild.invites.fetch().then(guildInvites => {
      invites[guild.id] = guildInvites;
    });
  });

});

//automatisches Refreshen der Invites, bei Hinzufügen/Entfernen

client.on("inviteDelete", (invite) => {
  // Delete the Invite from Cache
  refreshInvites(invite);
  //console.log(invites);
});

client.on("inviteCreate", (invite) => {
  // Update cache on new invites
  refreshInvites(invite);
  //console.log(invites);
});


//Anmeldesystem: Rollen werden je nach Invite vergeben

client.on("guildMemberAdd", member => {
  //console.log(member.guild.features);
  //Wenn ein Server kein Rules Screening verwendet, wird ein anderes System verwendet.
  if (!member.guild.features.includes("MEMBER_VERIFICATION_GATE_ENABLED")) {
    //console.log("Kein Membership Screening!");
      //console.log("Now checking....");
      refreshFiles();
      const old = {};
      invites[member.guild.id].forEach(inv => {
        old[inv.code] = {code: inv.code, uses: inv.uses};
      });
      member.guild.invites.fetch().then(guildInvites => {
        invites[member.guild.id] = guildInvites;
        const invite = guildInvites.find(inv => old[inv.code].uses < inv.uses);
        const logChannel = utils.findLogChannel(member);
        if(!invite) {
          logChannel?.send(`Error: No invite found. New member ${member.tag} probably joined using a single use invite.`);
            const channel = member.guild.channels.cache.get(config.welcomeChannel);
            channel?.send(`Herzlich Willkommen auf dem bits4kids-Discord Server, ${member}!`);
          return;
        }
        const inviter = client.users.cache.get(invite.inviter.id);
        //console.log(invite);
        logChannel?.send(`${member.user} joined using invite code ${invite.code} from ${inviter}. Invite was used ${invite.uses} times since its creation. This was the URL: ${invite.url}`);
        let roleList = "";
        for(const key in connections[member.guild.id]) {
          //console.log(`Now checking ${key}`);
          if (key === invite.code) {
            for (let i = 0; i < connections[member.guild.id][key].connections.length; i++) {
              let role = member.guild.roles.cache.find(role => role.id === connections[member.guild.id][key].connections[i]);
              //console.log(connections[member.guild.id][key].connections[i]);
              //console.log(`Found the Role ${role}`);
              member.roles.add(role);
              roleList = roleList + role.name + "\n";
              logChannel?.send(`Added role ${role} to user ${member.user}.`);
            }
          }
        }
        if (utils.checkArrayEmpty(roleList) == true) {
          logChannel?.send(`No roles connected to this invite.`);
        }
      });

      //Beginner-Mode
      const beginnerRole = utils.getRole(member, config.BeginnerRolle);

      utils.addBeginners(member, member.user);
      if(beginnerRole) {
        member.roles.add(beginnerRole);
      }


      const channel = member.guild.channels.cache.get(config.welcomeChannel);
      channel?.send(`Herzlich Willkommen auf dem bits4kids-Discord Server, ${member}!`);
    return;
  }
  //System bei Rules Screening. Es wird gewartet, bis die Regeln akzeptiert werden, bevor die Rolle hinzugefügt wird. Hier: Wenn der Server betreten wird
  //console.log("Now checking....");
  const old = {};
  invites[member.guild.id].forEach(inv => {
    old[inv.code] = {code: inv.code, uses: inv.uses};
  });
  console.log(invites[member.guild.id]);
  console.log(old);
  //refreshFiles();
  member.guild.invites.fetch().then(guildInvites => {
    invites[member.guild.id] = guildInvites;
    const invite = guildInvites.find(inv => {
      if (typeof old[inv.code] === "undefined") {
        return false;
      }
      return old[inv.code].uses < inv.uses;
    });
    if (typeof invite === "undefined") {
      const logChannel = utils.findLogChannel(member);
      logChannel?.send(`Warning: Encountered an error while trying to find the invite.\n${member.tag}`);
      logChannel?.send("old: `" + JSON.stringify(old) + "`");
      logChannel?.send("invites: `" + JSON.stringify(invites[member.guild.id].map(inv => {return {code: inv.code, uses: inv.uses}})) + "`");
      return;
    }
    const inviter = client.users.cache.get(invite.inviter.id);
    //console.log(invite);
    const logChannel = utils.findLogChannel(member);
    logChannel?.send(`${member.user} joined using invite code ${invite.code} from ${inviter}. Invite was used ${invite.uses} times since its creation. This was the URL: ${invite.url}\nAwaiting Membership Screening.`);
    if(member.guild.id in fromWhere === false) {
      fromWhere[member.guild.id] = {};
    }
    let guildMember = fromWhere[member.guild.id];
    guildMember[member.id] = invite;
    /*let roleList = "";
    for(const key in connections[member.guild.id]) {
      //console.log(`Now checking ${key}`);
      if (key === invite.code) {
        for (let i = 0; i < connections[member.guild.id][key].connections.length; i++) {
          let role = member.guild.roles.cache.find(role => role.id === connections[member.guild.id][key].connections[i]);
          //console.log(connections[member.guild.id][key].connections[i]);
          //console.log(`Found the Role ${role}`);
          member.roles.add(role);
          roleList = roleList + role.name + "\n";
          logChannel?.send(`Added role ${role} to user ${member.user}.`);
        }
      }
    }
    if (utils.checkArrayEmpty(roleList) == true) {
      logChannel?.send(`No roles connected to this invite.`);
    }
    const channel = member.guild.channels.cache.get(875746344323674232);
    channel?.send(`Herzlich Willkommen auf dem bits4kids-Discord Server, ${member}!`);*/
  });
});

//Wenn die Regeln akzeptiert werden
client.on("guildMemberUpdate", (oldMember, newMember) => {
  //console.log("hi");
  if (oldMember.pending && !newMember.pending) {
    const member = newMember;
    //yconsole.log("Now checking....");
    refreshFiles();
    const logChannel = utils.findLogChannel(member);
    let invite;
    if(member.guild.id in fromWhere === false) {
      fromWhere[member.guild.id] = {};
    }
    let guildMember = fromWhere[member.guild.id];
    if(member.id in guildMember === true) {
      invite = guildMember[member.id];
      logChannel?.send(`Member ${member.user} passed membership screening.`)
    } else {
      logChannel?.send(`Warning: Member ${member.user} passed membership screening, but they were not among the pending users.`);
    }
    //member.guild.invites.fetch().then(guildInvites => {
    //  const old = invites[member.guild.id];
    //  invites[member.guild.id] = guildInvites;
    //  const invite = guildInvites.find(inv => old.get(inv.code).uses < inv.uses);
    //  const inviter = client.users.cache.get(invite.inviter.id);
      //console.log(invite);
    //  logChannel?.send(`${member.user} joined using invite code ${invite.code} from ${inviter}. Invite was used ${invite.uses} times since its creation. This was the URL: ${invite.url}`);
    if(invite) { 
    let roleList = "";
      for(const key in connections[member.guild.id]) {
        //console.log(`Now checking ${key}`);
        if (key === invite.code) {
          for (let i = 0; i < connections[member.guild.id][key].connections.length; i++) {
            let role = member.guild.roles.cache.find(role => role.id === connections[member.guild.id][key].connections[i]);
            //console.log(connections[member.guild.id][key].connections[i]);
            //console.log(`Found the Role ${role}`);
            member.roles.add(role);
            roleList = roleList + role.name + "\n";
            logChannel?.send(`Added role ${role} to user ${member.user}.`);
          }
        }
      }
      if (utils.checkArrayEmpty(roleList) == true) {
        logChannel?.send(`No roles connected to this invite.`);
      }
      delete guildMember[member.id];
    } else {
      logChannel?.send(`Skipping invite-connection system.`);
    }

      //Beginner-Mode
      const beginnerRole = utils.getRole(member, config.BeginnerRolle);
      
      utils.addBeginners(member, member.user);
      if(beginnerRole) {
        member.roles.add(beginnerRole);
      }

      
      const channel = member.guild.channels.cache.get(config.welcomeChannel);
      channel?.send(`Herzlich Willkommen auf dem bits4kids-Discord Server, ${member}!`);
    //});
  }
});


//Rollensystem per Buttons

client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;
	//console.log(interaction);
  await interaction.deferReply({ ephemeral: true });
  const button = interaction;
  refreshFiles();
  const logChannel = utils.findLogChannel(button);
  logChannel?.send(`${button.user} clicked button!`);
  const member = button.guild.members.cache.get(button.user.id);
  //console.log(member);
  let roleList = "";
  let roleAlready = "";
  for(const key in buttons[button.guild.id]) {
    if (key === button.customId) {
      for (let i = 0; i < buttons[button.guild.id][key].buttons.length; i++) {
        let role = button.guild.roles.cache.find(role => role.id === buttons[button.guild.id][key].buttons[i]);
        if (!member.roles.cache.has(role.id)) {
          member.roles.add(role);
          roleList = roleList + role.name + "\n";
          logChannel?.send(`Added role ${role} to user ${button.user}.`);
        } else {
          roleAlready = roleAlready + role.name + "\n";
        }

      }
    }
  }
  if ((utils.checkArrayEmpty(roleList) == true) && (utils.checkArrayEmpty(roleAlready) == true)) {
    await button.editReply("Diesem Knopf wurden noch keine Rollen hinzugefügt!");
    logChannel?.send(`No roles connected to the button ${button.customId}.`);
  } else if ((utils.checkArrayEmpty(roleList) == true) && (utils.checkArrayEmpty(roleAlready) == false)) {
    await button.editReply("Du hast bereits alle Rollen!");
    logChannel?.send(`User already has all roles connected to the button ${button.customId}.`);
  } else if ((utils.checkArrayEmpty(roleList) == false) && (utils.checkArrayEmpty(roleAlready) == false)) {
    await button.editReply("Folgende Rollen wurden erfolgreich hinzugefügt: \n" + roleList + ":white_check_mark:" + "\nFolgende Rollen hast du bereits: \n" +roleAlready);
    logChannel?.send(`User already has the role(s): \n${roleAlready}Added role(s): \n${roleList}Connected to the button ${button.customId}.`);
  } else {
    await button.editReply("Folgende Rollen wurden erfolgreich hinzugefügt: \n" + roleList + ":white_check_mark:");
    logChannel?.send(`User didn't have any roles. Added roles: \n${roleList}Connected to the button ${button.customId}.`);
    }
    //await button.reply.delete();
});

//Voice Channel Detection
client.on("voiceStateUpdate", (oldState, newState) => {
  const trainRole = newState.guild.roles.cache.find(r => r.id === config.TrainerRolle);
  const orgRole = newState.guild.roles.cache.find(r => r.id === config.OrganisationRolle);
  if ((trainRole) && (orgRole) && (newState.member.roles) && ((newState.member.roles.cache.has(trainRole.id)) || (newState.member.roles.cache.has(orgRole.id)))) {
    return;
  }
  if ((newState.channel) && (oldState.channel) && (newState.channel.id === oldState.channel.id)) return;

  const Zeit = new Date().toLocaleString("en-GB")
  
  if ((newState.channel) && (!oldState.channel)) {
    if(!newState.channel.name.includes(config.Meetingräume)) return;
    const VoiceLogChannel = utils.findVoiceLogChannel(newState);
    VoiceLogChannel?.send(`${newState.member} has joined the voice channel "${newState.channel.name}".\nTime: ${Zeit}`);

    //Beginner Mode Check
    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;

    const member = newState.member;
    const beginnerRole = utils.getRole(member, config.BeginnerRolle);

    const beginners = utils.getBeginners(member, member.user);
    const guildbeginners = beginners[member.guild.id];

    if(member.user.id in guildbeginners === false) return;

    const userBeginner = beginners[member.guild.id][member.user.id];

    if((userBeginner.joined) && ((Date.now() - userBeginner.joined) >= 4*week)) {
      if(beginnerRole && member.roles.cache.has(beginnerRole) == true) {
        member.roles.remove(beginnerRole);
      }
      delete(beginners[member.guild.id][member.user.id]);

      fs.writeFileSync("./beginners.json", JSON.stringify(beginners, null, 2), err => {
        if(err) console.log(err)
      });
    }

  }/* else if ((!newState.channel) && (oldState.channel)) {
    if(!oldState.channel.name.includes(config.Meetingräume)) return;
    VoiceLogChannel?.send(`${newState.member} has left the voice channel "${oldState.channel.name}".\nTime: ${Zeit}`);
  }*/ else if ((newState.channel) && (oldState.channel)) {
    if (newState.channel.id !== oldState.channel.id) {
      if(!newState.channel.name.includes(config.Meetingräume)) return;
      const VoiceLogChannel = utils.findVoiceLogChannel(newState);
      VoiceLogChannel?.send(`${newState.member} switched from voice channel "${oldState.channel.name}" to "${newState.channel.name}".\nTime: ${Zeit}`);
    }
  }

});

//Command- & Levelsystem

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.guild) {
    msg.reply("Entschuldigung, aber der Bot funktioniert nur in Servern.")
    return;
  }


  let guildPrefix = prefix.getPrefix(msg.guild.id);
  if (!guildPrefix) guildPrefix = defaultPrefix;

  if (!msg.content.startsWith(guildPrefix)) {
    const trainRole = msg.guild.roles.cache.find(r => r.id === config.TrainerRolle);
    const orgRole = msg.guild.roles.cache.find(r => r.id === config.OrganisationRolle);
    if ((trainRole) && (orgRole) && (msg.member.roles) && ((msg.member.roles.cache.has(trainRole.id)) || (msg.member.roles.cache.has(orgRole.id)))) {
      return;
    }

      //Vergabe von XP-Punkten

  const userXP = utils.getXP(msg, msg.author)[msg.guild.id][msg.author.id];

  //Checken, wann die letzte Nachricht war, dann Vergabe per Zufall

  if(userXP.timeout >= Date.now()) return;
  if(Date.now() - userXP.last_message >= 30000) {
    xp_levels.addXP(msg, msg.author, utils.randomNumber(15, 25), guildPrefix);
  }
    return;
  }

  // Blacklist
  if (config.blacklist.includes(msg.author.id)) {
    msg.author.send("Das darfst du nicht machen!");
    return;
  }

  //Commands
  const args = msg.content.substr(guildPrefix.length).split(/ +/);
  const cmd = args.shift().toLowerCase();

  const command = client.commands.get(cmd);
  if(!command) return;
  try {
    command.execute(msg, args, client, guildPrefix, invites, fromWhere);
  } catch (error) {
    console.error(error);
    msg.reply("There was an error trying to execute the command!");
    const logChannel = utils.findLogChannel(msg);
    logChannel?.send(`Error trying to execute command ${command.data.name} in channel ${msg.channel}. ${msg.guild.members.cache.get(config.author)}\nError: ${error}`)
  }
});

//Willkommensnachricht des Bots
client.on("guildCreate", async (guild) => {
  const channel = utils.findGoodChannel(guild);
  let guildPrefix = prefix.getPrefix(guild.id);
  if (!guildPrefix) guildPrefix = defaultPrefix;
  if (channel) {
    channel.send(
      `Hallo! Ich bin ein nützlicher Discord Bot, der vom Programmierer und Discord-Benutzer emeraldingg#2697 erstellt wurde. Mein aktueller Prefix ist ${guildPrefix}. Mit mir kannst du Katzenfotos bekommen, zufällige Zahlen erstellen und Blackjack spielen.\nIch hoffe du hast Spaß! Version: ${version}`
      );
  }
  guild.invites.fetch().then(guildInvites => {
    invites[guild.id] = guildInvites;
  });
});

client.login(config.tokenTest);


function refreshFiles() {
  connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
  buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));
}

function refreshInvites(msg) {
  msg.guild.invites.fetch().then(guildInvites => {
    invites[msg.guild.id] = guildInvites;
  });
}
