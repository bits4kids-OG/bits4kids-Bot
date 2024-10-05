require("dotenv").config();

const Discord = require("discord.js");

const intents = new Discord.IntentsBitField();
intents.add(
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.DirectMessageReactions,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.GuildScheduledEvents,
    Discord.GatewayIntentBits.AutoModerationExecution,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildInvites,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.Guilds
);

const client = new Discord.Client({ intents });

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db");

db.exec(`--sql
    CREATE TABLE IF NOT EXISTS xpLevels_UserXPData (
        userId TEXT NOT NULL,
        guildId TEXT NOT NULL,
        level INTEGER,
        xp INTEGER,
        last_message INTEGER,
        timeout INTEGER,
        acceptLB INTEGER DEFAULT 0,
        PRIMARY KEY(userId, guildId)
    );
`);
db.exec(`--sql
    CREATE TABLE IF NOT EXISTS xpLevels_HistoryData (
        userId TEXT NOT NULL,
        guildId TEXT NOT NULL,
        changeDate INTEGER NOT NULL,
        level INTEGER,
        xp INTEGER,
        PRIMARY KEY(userId, guildId, changeDate)
    );
`);
db.exec(`--sql
    CREATE TABLE IF NOT EXISTS users_UserBirthdayData (
        userId TEXT NOT NULL PRIMARY KEY,
        displayName TEXT,
        birthday INTEGER
    );
`);

const leaderboard = require("./leaderboard.js");


const config = require("./config.json");
const { version } = require("./package.json");
const fs = require("fs");
const path = require("path");

const cron = require("cron");

const utils = require("./utils.js");
const xp_levels = require("./xp-and-levels.js");
const driveAutoEvents = require("./driveAutoEvents.js");
const beginnerPurge = require("./beginnerPurge.js");


if (!fs.existsSync("./backups")) {
    fs.mkdirSync("./backups");
}

let prefixes = {};
if(fs.existsSync("./prefixes.json")) {
    prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
} else {
    fs.writeFileSync("./prefixes.json", JSON.stringify(prefixes, null, 2), err => {
        if(err) console.log(err);
    });
}

let connections = {};
if(fs.existsSync("./connections.json")) {
    connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
} else {
    fs.writeFileSync("./connections.json", JSON.stringify(connections, null, 2), err => {
        if(err) console.log(err);
    });
}
let buttons = {};
if(fs.existsSync("./buttons.json")) {
    buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));
} else {
    fs.writeFileSync("./buttons.json", JSON.stringify(buttons, null, 2), err => {
        if(err) console.log(err);
    });
}

const invites = {};
let fromWhere = {};

let voicelogUsers = {};

const backupFileNames = getAllBackupFiles(process.cwd());

let defaultPrefix = config.defaultPrefix;


client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync("./cmds").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./cmds/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}

//Login

client.on(Discord.Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ activities: [{ name: `-> ${defaultPrefix}help <-` }], status: "online" });

    try {
        client.guilds.fetch().then((guildsCollection) => guildsCollection.each((partialGuild) => partialGuild.fetch().then((guild) => {
            guild.invites.fetch().then((guildInvites) => {
                invites[guild.id] = guildInvites;
            });
        })));
    } catch (error) {
        console.error("Encountered an error while trying to fetch guild invites:", error);
    }
    
    //Check VoiceLogRecovery
    voicelogUsers = utils.getVoicelogRecovery();
    for(const guildId in voicelogUsers) {
        const guild = await client.guilds.fetch(guildId).catch(console.error);
        for(const user in voicelogUsers[guildId]) {
            const member = await guild.members.fetch(user).catch(console.error);
            if(!member) {
                delete(voicelogUsers[guildId][user]);
                continue;
            }
            if((!member.voice.channel) || ((!member.voice.channel.name.toLowerCase().includes(config.Meetingräume)))) {
                const now = Date.now();
                const duration = now - voicelogUsers[guildId][user].joined;
                const duration_string = utils.msToTime(duration);
                const Zeit = new Date(voicelogUsers[guildId][user].joined).toLocaleString("en-GB");
                const VoiceLogChannel = utils.findVoiceLogChannel(guild);

                VoiceLogChannel?.send(`${member} has left an OCC voice channel during bot downtime.\nJoined at: ${Zeit}\nUser was in the channel for at most ${duration_string}`);
                delete(voicelogUsers[guildId][user]);
            }
        }
        fs.writeFileSync("./voicelogRecovery.json", JSON.stringify(voicelogUsers, null, 2), err => {
            if(err) console.log(err);
        });
    }

    const checkEventJob = cron.CronJob.from({
        cronTime: "00 00 03,15,20 * * *",
        onTick: () => {
            driveAutoEvents.createEvents(client);
        },
        timeZone: "Europe/Vienna"
    });
    checkEventJob.start();

    const doBackupJob = cron.CronJob.from({
        cronTime: "00 00 03 */5 * *",
        onTick: () => {
            doBackup(backupFileNames);
        },
        timeZone: "Europe/Vienna"
    });
    doBackupJob.start();


    const exportLeaderBoard = cron.CronJob.from({
        cronTime: "00 30 03 * * *",
        onTick: () => {
            leaderboard.createLeaderboard(client);
        },
        timeZone: "Europe/Vienna"
    });
    exportLeaderBoard.start();

    const purgeBeginnersJob = cron.CronJob.from({
        cronTime: "00 00 01 */5 * *",
        onTick: () => {
            beginnerPurge.purgeDefaultBeginners(client);
        },
        timeZone: "Europe/Vienna"
    });
    purgeBeginnersJob.start();
});

//automatisches Refreshen der Invites, bei Hinzufügen/Entfernen

client.on(Discord.Events.InviteDelete, (invite) => {
    // Delete the Invite from Cache
    refreshInvites(invite);
});

client.on(Discord.Events.InviteCreate, (invite) => {
    // Update cache on new invites
    refreshInvites(invite);
});


//Anmeldesystem: Rollen werden je nach Invite vergeben

client.on(Discord.Events.GuildMemberAdd, member => {
    if (member.user.bot) return;
    //Wenn ein Server kein Rules Screening verwendet, wird ein anderes System verwendet.
    if (!member.guild.features.includes("MEMBER_VERIFICATION_GATE_ENABLED")) {
        refreshFiles();
        const old = {};
        invites[member.guild.id].forEach(inv => {
            old[inv.code] = {code: inv.code, uses: inv.uses};
        });
        member.guild.invites.fetch().then(guildInvites => {
            invites[member.guild.id] = guildInvites;
            const invite = guildInvites.find(inv => old[inv.code].uses < inv.uses);
            const logChannel = utils.findLogChannel(member.guild);
            if(!invite) {
                logChannel?.send(`Error: No invite found. New member ${member.tag} probably joined using a single use invite.`);
                const channel = member.guild.channels.cache.get(config.welcomeChannel);
                channel?.send(`Herzlich Willkommen auf dem bits4kids-Discord Server, ${member}!`);
                return;
            }
            const inviter = client.users.cache.get(invite.inviter.id);
            logChannel?.send(`${member.user} joined using invite code ${invite.code} from ${inviter}. Invite was used ${invite.uses} times since its creation. This was the URL: ${invite.url}`);
            let roleList = "";
            for(const key in connections[member.guild.id]) {
                if (key === invite.code) {
                    for (let i = 0; i < connections[member.guild.id][key].connections.length; i++) {
                        let role = member.guild.roles.cache.find(role => role.id === connections[member.guild.id][key].connections[i]);
                        member.roles.add(role);
                        roleList = roleList + role.name + "\n";
                        logChannel?.send(`Added role ${role} to user ${member.user}.`);
                    }
                }
            }
            if (utils.checkArrayEmpty(roleList) == true) {
                logChannel?.send("No roles connected to this invite.");
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
    const old = {};
    invites[member.guild.id].forEach(inv => {
        old[inv.code] = {code: inv.code, uses: inv.uses};
    });
    member.guild.invites.fetch().then(guildInvites => {
        invites[member.guild.id] = guildInvites;
        const invite = guildInvites.find(inv => {
            if (typeof old[inv.code] === "undefined") {
                return false;
            }
            return old[inv.code].uses < inv.uses;
        });
        if (typeof invite === "undefined") {
            const logChannel = utils.findLogChannel(member.guild);
            logChannel?.send(`Warning: Encountered an error while trying to find the invite.\n${member.tag}`);
            logChannel?.send("old: `" + JSON.stringify(old, null, 2) + "`");
            logChannel?.send("invites: `" + JSON.stringify(invites[member.guild.id].map(inv => {return {code: inv.code, uses: inv.uses};}), null, 2) + "`");
            return;
        }
        const inviter = client.users.cache.get(invite.inviter.id);
        const logChannel = utils.findLogChannel(member.guild);
        logChannel?.send(`${member.user} joined using invite code ${invite.code} from ${inviter}. Invite was used ${invite.uses} times since its creation. This was the URL: ${invite.url}\nAwaiting Membership Screening.`);
        if(member.guild.id in fromWhere === false) {
            fromWhere[member.guild.id] = {};
        }
        let guildMember = fromWhere[member.guild.id];
        guildMember[member.id] = invite;
    });
});

//Wenn die Regeln akzeptiert werden
client.on(Discord.Events.GuildMemberUpdate, (oldMember, newMember) => {
    if (oldMember.pending && !newMember.pending) {
        const member = newMember;
        refreshFiles();
        const logChannel = utils.findLogChannel(member.guild);
        let invite;
        if(member.guild.id in fromWhere === false) {
            fromWhere[member.guild.id] = {};
        }
        let guildMember = fromWhere[member.guild.id];
        if(member.id in guildMember === true) {
            invite = guildMember[member.id];
            logChannel?.send(`Member ${member.user} passed membership screening.`);
        } else {
            logChannel?.send(`Warning: Member ${member.user} passed membership screening, but they were not among the pending users.`);
        }
        if(invite) { 
            let roleList = "";
            for(const key in connections[member.guild.id]) {
                if (key === invite.code) {
                    for (let i = 0; i < connections[member.guild.id][key].connections.length; i++) {
                        let role = member.guild.roles.cache.find(role => role.id === connections[member.guild.id][key].connections[i]);
                        member.roles.add(role);
                        roleList = roleList + role.name + "\n";
                        logChannel?.send(`Added role ${role} to user ${member.user}.`);
                    }
                }
            }
            if (utils.checkArrayEmpty(roleList) == true) {
                logChannel?.send("No roles connected to this invite.");
            }
            delete guildMember[member.id];
        } else {
            logChannel?.send("Skipping invite-connection system.");
        }

        //Beginner-Mode
        const beginnerRole = utils.getRole(member, config.BeginnerRolle);
      
        utils.addBeginners(member, member.user);
        if(beginnerRole) {
            member.roles.add(beginnerRole);
        }

      
        const channel = member.guild.channels.cache.get(config.welcomeChannel);
        channel?.send(`Herzlich Willkommen auf dem bits4kids-Discord Server, ${member}!`);
    }
});


//Rollensystem per Buttons

client.on(Discord.Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;
    await interaction.deferReply({ ephemeral: true });
    const button = interaction;
    const logChannel = utils.findLogChannel(button.guild);

    if(button.customId === "optinLB") {
        leaderboard.changeAcceptLB(button, 1);
        logChannel?.send(`${button.user} opted in the leaderboard!`);
        await button.editReply("Du nimmst nun teil am Leaderboard!");
        return;
    } else if(button.customId === "optoutLB") {
        leaderboard.changeAcceptLB(button, 0);
        logChannel?.send(`${button.user} opted out the leaderboard!`);
        await button.editReply("Du nimmst nun nicht mehr teil am Leaderboard!");
        return;
    }

    refreshFiles();
    logChannel?.send(`${button.user} clicked button!`);
    const member = button.guild.members.cache.get(button.user.id);
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
        await button.editReply("Dieser Knopf ist noch nicht aktiviert!");
        logChannel?.send(`No roles connected to the button ${button.customId}.`);
    } else if ((utils.checkArrayEmpty(roleList) == true) && (utils.checkArrayEmpty(roleAlready) == false)) {
        await button.editReply("Du siehst bereits die Kanäle dieses Coding Clubs!");
        logChannel?.send(`User already has all roles connected to the button ${button.customId}.`);
    } else if ((utils.checkArrayEmpty(roleList) == false) && (utils.checkArrayEmpty(roleAlready) == false)) {
        await button.editReply("Folgende Coding Club Kanäle siehst du jetzt: \n" + roleList + ":white_check_mark:" + "\nDiese hast du bereits vorher gesehen: \n" +roleAlready);
        logChannel?.send(`User already has the role(s): \n${roleAlready}Added role(s): \n${roleList}Connected to the button ${button.customId}.`);
    } else {
        await button.editReply("Folgende Coding Club Kanäle siehst du jetzt: \n" + roleList + ":white_check_mark:");
        logChannel?.send(`User didn't have any roles. Added roles: \n${roleList}Connected to the button ${button.customId}.`);
    }
    //await button.reply.delete();
});

//Automatische XP-Abzüge bei Benutzung von Schimpfwörtern
client.on(Discord.Events.AutoModerationActionExecution, (execution) => {
    if(execution.action.type === Discord.AutoModerationActionType.BlockMessage) {
        //if(execution.ruleTriggerType === Discord.AutoModerationRuleTriggerType.Spam) return;
        const xpRemoval = -100;
        if ((execution.user.id === client.user.id) || (execution.user.bot)) {
            return;
        }
        if(execution.member.roles && utils.checkIfTrainer(execution.member.roles.cache) === true) {
            return;
        }
        let guildPrefix = getPrefix(execution.guild.id);
        if (!guildPrefix) guildPrefix = defaultPrefix;
        xp_levels.removeXP(execution, execution.user, xpRemoval, guildPrefix);
        execution.user.send(`Wir bitten um einen freundlichen und respektvollen Umgang auf unserem Server. Schimpfwörter und Spam sind hier nicht erlaubt, daher wurden dir ${Math.abs(xpRemoval)} XP abgezogen.`);
    }
});

//Check, ob Events von Trainer:innen bearbeitet wurden
client.on(Discord.Events.GuildScheduledEventUpdate, async (oldGuildScheduledEvent, newGuildScheduledEvent) => {
    if(newGuildScheduledEvent.creator !== client.user) return;
    if(newGuildScheduledEvent.status !== Discord.GuildScheduledEventStatus.Scheduled) return;
    await driveAutoEvents.manualEventUpdate(oldGuildScheduledEvent, newGuildScheduledEvent, client);
});

//Voice Channel Detection
client.on(Discord.Events.VoiceStateUpdate, (oldState, newState) => {
    if(newState.member.roles && utils.checkIfTrainer(newState.member.roles.cache) === true) {
        return;
    }
    if ((newState.channel) && (oldState.channel) && (newState.channel.id === oldState.channel.id)) return;

    const VoiceLogChannel = utils.findVoiceLogChannel(newState.guild);
  
    if ((newState.channel) && (!oldState.channel)) {
        if(!newState.channel.name.toLowerCase().includes(config.Meetingräume)) return;

        voicelogUsers = utils.addVoicelogRecovery(newState.guild, newState.member.user);

        //Beginner Mode Check

        const member = newState.member;

        const beginners = utils.getBeginners(member);
        const guildbeginners = beginners[member.guild.id];

        if(member.user.id in guildbeginners === false) return;

        const userBeginner = beginners[member.guild.id][member.user.id];

        const minute = 1000 * 60;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;

        if((userBeginner.joined) && ((Date.now() - userBeginner.joined) >= 4*week)) {
            const beginnerRole = utils.getRole(member, config.BeginnerRolle);
            if(beginnerRole && member.roles.cache.has(beginnerRole.id)) {
                member.roles.remove(beginnerRole);
            }
            delete(beginners[member.guild.id][member.user.id]);

            fs.writeFileSync("./beginners.json", JSON.stringify(beginners, null, 2), err => {
                if(err) console.log(err);
            });
        }

    } else if ((!newState.channel) && (oldState.channel)) {
        if(!oldState.channel.name.toLowerCase().includes(config.Meetingräume)) return;
        const member = newState.member;
        voicelogLeftChannel(member, newState, oldState, VoiceLogChannel);

    } else if ((newState.channel) && (oldState.channel)) {
        if (newState.channel.id !== oldState.channel.id) {
            if((!newState.channel.name.toLowerCase().includes(config.Meetingräume)) && (oldState.channel.name.toLowerCase().includes(config.Meetingräume))) {
                voicelogLeftChannel(newState.member, newState, oldState, VoiceLogChannel);
            } else if((newState.channel.name.toLowerCase().includes(config.Meetingräume)) && (!oldState.channel.name.toLowerCase().includes(config.Meetingräume))) {
                voicelogUsers = utils.addVoicelogRecovery(newState.guild, newState.member.user);
            }
        }
    }

});

//Command- & Levelsystem

client.on(Discord.Events.MessageCreate, async (msg) => {
    if (msg.author.bot) return;
    if (!msg.guild) {
        msg.reply("Entschuldigung, aber der Bot funktioniert nur in Servern.");
        return;
    }
    if(msg.content === "") return;

    let guildPrefix = getPrefix(msg.guild.id);
    if (!guildPrefix) guildPrefix = defaultPrefix;

    if (!msg.content.startsWith(guildPrefix)) {
        if (config.blacklist.includes(msg.author.id)) {
            return;
        }

        //Trainer:innen bekommen keine XP
        if(msg.member.roles && utils.checkIfTrainer(msg.member.roles.cache) === true) {
            return;
        }

        //Vergabe von XP-Punkten

        const userXP = utils.getXP(msg, msg.author);

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
        const logChannel = utils.findLogChannel(msg.guild);
        logChannel?.send(`Error trying to execute command ${command.data.name} in channel ${msg.channel}. ${msg.guild.members.cache.get(config.author)}\nError: ${error}`);
    }
});

//Willkommensnachricht des Bots
client.on(Discord.Events.GuildCreate, async (guild) => {
    const channel = utils.findGoodChannel(guild);
    let guildPrefix = getPrefix(guild.id);
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

let token = config.token;
if(process.env.NODE_ENV && process.env.NODE_ENV === "testing") token = config.tokenTest;
client.login(token);


function voicelogLeftChannel(member, newState, oldState, VoiceLogChannel) {
    const guildVoicelogUsers = voicelogUsers[member.guild.id];
    if(member.user.id in guildVoicelogUsers === false) {
        const Zeit = new Date().toLocaleString("en-GB");
        VoiceLogChannel?.send(`**${oldState.channel.parent.name.slice(4)}:**\n${newState.member} has left the voice channel ${oldState.channel}.\nUser was not among the observed users, therefore no duration can be displayed.\nCurrent time: ${Zeit}`);
        return;
    }
    const userVoicelogUsers = voicelogUsers[member.guild.id][member.user.id];
    const Zeit = new Date(userVoicelogUsers.joined).toLocaleString("en-GB");
    const now = Date.now();
    const duration = now - userVoicelogUsers.joined;
    const duration_string = utils.msToTime(duration);
    VoiceLogChannel?.send(`**${oldState.channel.parent.name.slice(4)}:**\n${newState.member} has left the voice channel ${oldState.channel}.\nJoined at: ${Zeit}\nUser was in the channel for ${duration_string}`);
    delete(voicelogUsers[member.guild.id][member.user.id]);

    fs.writeFileSync("./voicelogRecovery.json", JSON.stringify(voicelogUsers, null, 2), err => {
        if(err) console.log(err);
    });
}

function refreshFiles() {
    connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
    buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));
}

function refreshInvites(msg) {
    msg.guild.invites.fetch().then(guildInvites => {
        invites[msg.guild.id] = guildInvites;
    });
}

function getPrefix(guildId) {
    if(guildId in prefixes === false) {
        return null;
    } else {
        return prefixes[guildId];
    }
}

function getAllBackupFiles(dirname) {
    const pattern = /^(?!package)(?!.*(?:config|sample|real|credentials)\.json$).+\.json$/i;
    try {
        const files = fs.readdirSync(dirname);
        const matchingFileNames = files.filter((file) => pattern.test(file));
        return matchingFileNames;
    } catch (error) {
        console.error(error);
        return [];
    }
}

function doBackup(backupFiles) {
    const backupDir = `./backups/backup-${Date.now()}/`;
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    db.backup(path.join(backupDir, "dbBackup.db"))
        .then(() => {
            console.log("backup complete!");
        })
        .catch((err) => {
            console.log("backup failed:", err);
        });
    doFilesBackup(backupFiles, process.cwd(), backupDir);
}

function doFilesBackup(backupFiles, sourceDirectory, backupDir) {
    console.log(backupFiles);
    backupFiles.forEach((file) => {
        const srcDir = path.join(sourceDirectory, file);
        const destDir = path.join(backupDir, `backup-${file}`);
        fs.copyFile(srcDir, destDir, (err) => {
            if(err) {
                return console.error(`Error copying file ${file}:`, err);
            }
            console.log(`Successfully backed up ${file}!`);
        });
    });
}

exports.refresh = async function(msg) {
    await msg.guild.invites.fetch().then(guildInvites => {
        invites[msg.guild.id] = guildInvites;
    });
    connections = JSON.parse(fs.readFileSync("./connections.json", "utf8"));
    buttons = JSON.parse(fs.readFileSync("./buttons.json", "utf8"));
};

exports.getPrefixes = function() {
    prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
};