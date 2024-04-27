const Discord = require("discord.js");
const fs = require("fs");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});


exports.findGoodChannel = function(guild) {
    return guild.channels.cache
        .filter((channel) => {
            if (channel.type !== Discord.ChannelType.GuildText) return false;
            return channel
                .permissionsFor(guild.members.me)
                .has(Discord.PermissionsBitField.Flags.SendMessages);
        })
        .first();
};
const inviteCodeReg = /^[a-z0-9]+$/i;
  
exports.getInviteCode = function(inviteCode) {
    inviteCode = inviteCode.replace("https://discord.gg/", "").replace("https://discordapp.com/invite/", "").replace("https://discord.com/invite/", "");
    if (!inviteCodeReg.test(inviteCode)) return null;
    return inviteCode;
};
  
exports.getRole = function(member, roleName) {
    let role;
    if (Number.isNaN(+roleName)) {
        role = member.guild.roles.cache.find(role => role.name === roleName);
    } else {
        role = member.guild.roles.cache.find(role => role.id === roleName);
    }
    if (!role) return null;
    return role;
};
  
exports.checkArrayEmpty = function(array) {
    if (array.length === 0) {
        return true;
    } else {
        return false;
    }
};
  
exports.findLogChannel = function(guild) {
    let logChannel = findLogChannel(guild);
    return logChannel;
};

exports.findVoiceLogChannel = function(guild) {
    let VoiceLogChannel = guild.channels.cache.find(channel => channel.name === "voicelog");
    if ((VoiceLogChannel) && (((VoiceLogChannel.permissionsFor(guild.members.me).has(Discord.PermissionsBitField.Flags.ViewChannel)) == false) || ((VoiceLogChannel.permissionsFor(guild.members.me).has(Discord.PermissionsBitField.Flags.SendMessages)) == false))) {
        VoiceLogChannel = null;
        const channel = findLogChannel(guild);
        if (channel) {
            channel.send("Please set up a channel named voicelog with the correct permissions!");
        }
    }
    if (!VoiceLogChannel) {
        const channel = findLogChannel(guild);
        if (channel) {
            channel.send("Please set up a channel named voicelog!");
        }
    }
    return VoiceLogChannel;
};
  
exports.Collatz = function(msg, number) {
    if (number <= 0) {
        msg.reply("Achtung! Nur postive Zahlen sind erlaubt.");
        return null;
    }
    if (number > 30) {
        msg.reply("Achtung! Aufgrund enormer Rechenleistung sind nur die natürlichen Zahlen von 1-30 erlaubt.");
        return null;
    }
    let ergebnis = number;
    let steps = 0;
    let highest = 0;
    
    while (ergebnis > 1) {
        if (ergebnis % 2 === 0) {
            ergebnis = ergebnis / 2;
        } else {
            ergebnis = ergebnis * 3 + 1;
        }
        steps++;
        if (ergebnis >= highest) {
            highest = ergebnis;
        }
    }
    let ergebnisse = [steps, highest];
    return ergebnisse;
};
  
exports.randomColor = function() {
    return Math.floor(Math.random() * 16777215);
};
exports.randomNumber = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.serverInvite = async function(msg) {
    let invite = await msg.channel.createInvite(
        {
            maxAge: 1800 * 1,
            maxUses: 1,
        },
        `Requested by ${msg.author.tag}`
    );
    msg.author.send(invite ? `Here's your server invite: ${invite}` : "Error!");
};

exports.Progressbar = function(value, maxValue, size) {
    const percentage = value / maxValue; // Calculate the percentage of the bar
    const progress = Math.round((size * percentage)); // Calculate the number of square caracters to fill the progress side.
    const emptyProgress = size - progress; // Calculate the number of dash caracters to fill the empty progress side.
  
    const progressText = "▰".repeat(progress); // Repeat is creating a string with progress * caracters in it
    const emptyProgressText = "▱".repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
    const percentageText = Math.round(percentage * 100) + "%"; // Displaying the percentage of the bar
  
    const bar = "```[" + progressText + emptyProgressText + "]" + percentageText + "```"; // Creating the bar
    return bar;
};

exports.findXpChannel = function(msg, name) {
    let channel = msg.guild.channels.cache.find(channel => channel.name === name);
    if ((channel) && (((channel.permissionsFor(msg.guild.members.me).has(Discord.PermissionsBitField.Flags.ViewChannel)) == false) || ((channel.permissionsFor(msg.guild.members.me).has(Discord.PermissionsBitField.Flags.SendMessages)) == false))) {
        channel = null;
        const sonstchannel = findLogChannel(msg.guild);
        if (sonstchannel) {
            sonstchannel.send("I don't have the permission to send messages in the xp-channel!");
        }
    }
    if (!channel) {
        const sonstchannel = findLogChannel(msg.guild);
        if (sonstchannel) {
            sonstchannel.send("Xp-channel not found!");
        }
    }
    return channel;
};

const stmt = db.prepare(`--sql
    SELECT
        level,
        xp,
        last_message,
        timeout
    FROM xpLevels
    WHERE userId = ? AND guildId = ?;
`);

exports.getXP = function(msg, user) {
    let row = stmt.get(user.id, msg.guild.id);
    if(!row) {
        row = {
            level: null,
            xp: null,
            last_message: null,
            timeout: null,
        };
    }
    for(const key in row) {
        if(Object.prototype.hasOwnProperty.call(row, key)) {
            row[key] ??= 0;
        }
    }
    return(row);
};

exports.addBeginners = function(msg, user) {
    let beginners = {};
    if(fs.existsSync("./beginners.json")) {
        beginners = JSON.parse(fs.readFileSync("./beginners.json", "utf8"));
    }
  
    if(msg.guild.id in beginners === false) {
        beginners[msg.guild.id] = {};
    }
    const guildbeginners = beginners[msg.guild.id];
    if(user.id in guildbeginners === false) {
        guildbeginners[user.id] = {
            joined: 0
        };
        const userBeginner = guildbeginners[user.id];
        userBeginner.joined = Date.now();

        fs.writeFileSync("./beginners.json", JSON.stringify(beginners, null, 2), err => {
            if(err) console.log(err);
        });
    }
};

exports.getBeginners = function(msg) {
    let beginners = {};
    if(fs.existsSync("./beginners.json")) {
        beginners = JSON.parse(fs.readFileSync("./beginners.json", "utf8"));
    }
  
    if(msg.guild.id in beginners === false) {
        beginners[msg.guild.id] = {};
        fs.writeFileSync("./beginners.json", JSON.stringify(beginners, null, 2), err => {
            if(err) console.log(err);
        });
    }

    return beginners;
};


exports.addVoicelogRecovery = function(guild, user) {
    let voicelogUsers = {};
    if(fs.existsSync("./voicelogRecovery.json")) {
        voicelogUsers = JSON.parse(fs.readFileSync("./voicelogRecovery.json", "utf8"));
    }
  
    if(guild.id in voicelogUsers === false) {
        voicelogUsers[guild.id] = {};
    }
    const guildVoicelogUsers = voicelogUsers[guild.id];
    if(user.id in guildVoicelogUsers === false) {
        guildVoicelogUsers[user.id] = {
            joined: 0
        };
    }
    const userVoicelogUsers = guildVoicelogUsers[user.id];
    userVoicelogUsers.joined = Date.now();

    fs.writeFileSync("./voicelogRecovery.json", JSON.stringify(voicelogUsers, null, 2), err => {
        if(err) console.log(err);
    });

    return voicelogUsers;
};

exports.getVoicelogRecovery = function() {
    let voicelogUsers = {};
    if(fs.existsSync("./voicelogRecovery.json")) {
        voicelogUsers = JSON.parse(fs.readFileSync("./voicelogRecovery.json", "utf8"));
    }
    return voicelogUsers;
};

exports.msToTime = function(duration) {
    var //milliseconds = Math.floor((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
};


const numberCodeReg = /^[0-9]\d*$/;

exports.isInDesiredForm = function(str) {
    var n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
};

exports.testNumber = function(number) {
    if (!numberCodeReg.test(Number(number))) return null;
    return Number(number);
};



function findLogChannel(guild) {
    let logChannel = guild.channels.cache.find(channel => channel.name === "log");
    if ((logChannel) && (((logChannel.permissionsFor(guild.members.me).has(Discord.PermissionsBitField.Flags.ViewChannel)) == false) || ((logChannel.permissionsFor(guild.members.me).has(Discord.PermissionsBitField.Flags.SendMessages)) == false))) {
        logChannel = null;
        const channel = findGoodChannel(guild);
        if (channel) {
            channel.send("Please set up a channel named log with the correct permissions!");
        }
    }
    if (!logChannel) {
        const channel = findGoodChannel(guild);
        if (channel) {
            channel.send("Please set up a channel named log!");
        }
    }
    return logChannel;
}

function findGoodChannel(guild) {
    return guild.channels.cache
        .filter((channel) => {
            if (channel.type !== Discord.ChannelType.GuildText) return false;
            return channel
                .permissionsFor(guild.members.me)
                .has(Discord.PermissionsBitField.Flags.SendMessages);
        })
        .first();
}

Date.isLeapYear = function (year) { 
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)); 
};

Date.getDaysInMonth = function (year, month) {
    return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

Date.prototype.isLeapYear = function () { 
    return Date.isLeapYear(this.getFullYear()); 
};

Date.prototype.getDaysInMonth = function () { 
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};

Date.prototype.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};