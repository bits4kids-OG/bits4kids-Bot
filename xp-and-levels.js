const Discord = require("discord.js");
const utils = require("./utils.js");
const config = require("./config.json");

const Database = require("better-sqlite3");
const db = new Database("./b4kBot.db", {fileMustExist: true});

const badgeLevelconfig = require("./badgeLevelconfig.json")["badges"];

const path = require("path");

//Vergabe von XP-Punkten

const insertXP = db.prepare(`--sql
    INSERT INTO xpLevels_UserXPData (userId, guildId, level, xp, last_message)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(userId, guildId)
        DO UPDATE SET
            level = excluded.level,
            xp = excluded.xp,
            last_message = excluded.last_message;
`);
const insertXPHistory = db.prepare(`--sql
    INSERT INTO xpLevels_HistoryData (userId, guildId, changeDate, level, xp)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(userId, guildId, changeDate)
        DO NOTHING;
`);


exports.addXP = function(msg, user, number, guildPrefix) {
    const userXP = utils.getXP(msg, user);

    const todaysDate = new Date().setHours(0,0,0,0);
    insertXPHistory.run(user.id, msg.guild.id, todaysDate, userXP.level, userXP.xp);

    userXP.xp += number;
    userXP.last_message = Date.now();
    
    //Level

    let xpToNextLevel = LvlAlg(userXP.level);
    while(userXP.xp >= xpToNextLevel) {
        userXP.level ++;
        userXP.xp = userXP.xp - xpToNextLevel;
        xpToNextLevel = LvlAlg(userXP.level);
        nextLevel(msg, user, guildPrefix, userXP);
    }
    insertXP.run(user.id, msg.guild.id, userXP.level, userXP.xp, userXP.last_message);
};

exports.removeXP = function(msg, user, number, guildPrefix) {
    const userXP = utils.getXP(msg, user);

    userXP.xp += number;
    userXP.last_message = Date.now();
    
    //Level

    let levelDowngrade = false;
    let xpPrevLevel = LvlAlg(userXP.level-1);
    while(userXP.xp < 0) {
        levelDowngrade = true;
        if(userXP.level > 0) {
            userXP.level -= 1;
            userXP.xp = userXP.xp + xpPrevLevel;
            xpPrevLevel = LvlAlg(userXP.level-1);
        } else {
            userXP.xp = 0;
        }
    }
    insertXP.run(user.id, msg.guild.id, userXP.level, userXP.xp, userXP.last_message);

    const todaysDate = new Date().setHours(0,0,0,0);
    insertXPHistory.run(user.id, msg.guild.id, todaysDate, userXP.level, userXP.xp);

    if(levelDowngrade === true) nextLevel(msg, user, guildPrefix, userXP);
};

//Abfrage nach XP durch den Benutzer

exports.xpInfoScreen = function(msg, user) {
    const userXP = utils.getXP(msg, user);

    const xpToNextLevel = LvlAlg(userXP.level);

    const progressBar = utils.Progressbar(userXP.xp, xpToNextLevel, 24);


    const xpErgebnis = new Discord.EmbedBuilder()
        .setColor(utils.randomColor())
        .setTitle(`XP-Level von ${user.username}`)
        .setDescription("Für jede Nachricht, die du bei uns am Server schreibst, bekommst du XP. Mit genügend XP kannst du ein Level aufsteigen und dir so Badges verdienen. Falls du noch Fragen zum Level-System hast, frage eine/einen von unseren Trainerinnen/Trainern :)")
        .setThumbnail(user.avatarURL());

    if(userXP.timeout >= Date.now()) {
        const timeoutDate = new Date(userXP.timeout);
        xpErgebnis.addFields({ name: "Timeout bis:", value: `${timeoutDate.toLocaleString("en-GB")}` });
    }

    xpErgebnis.addFields([
        { name: "Derzeitiges Level:", value: userXP.level.toString() },
        { name: "Nächstes Level:", value: (userXP.level + 1).toString() },
        { name: "Derzeitige XP:", value: userXP.xp.toString() },
        { name: "Benötigte XP:", value: xpToNextLevel.toString() },
        { name: "Fehlende XP:", value: (xpToNextLevel - userXP.xp).toString() },
        { name: "ProgressBar:", value: progressBar }
    ])
        .setTimestamp();
    return xpErgebnis;
};

//Gratulation bei Level-Up

exports.levelUp = function(msg, user, guildPrefix, optUserXP) {
    nextLevel(msg, user, guildPrefix, optUserXP);
};

function nextLevel(msg, user, guildPrefix, optUserXP) {
    const userXP = optUserXP ?? utils.getXP(msg, user);

    const xpToNextLevel = LvlAlg(userXP.level);

    let progressBar;
    let fehlendeXP;
    if(userXP.xp >= xpToNextLevel) {
        progressBar = utils.Progressbar(xpToNextLevel, xpToNextLevel, 24);
        fehlendeXP = 0;
    } else {
        progressBar = utils.Progressbar(userXP.xp, xpToNextLevel, 24);
        fehlendeXP = xpToNextLevel - userXP.xp;
    }

    const levelUp = new Discord.EmbedBuilder()
        .setColor(utils.randomColor())
        .setTitle(`${user.username} ist gerade ein Level aufgestiegen!`)
        .setDescription("Gratulation!")
        .setThumbnail(user.avatarURL())
        .addFields([
            { name: "Level-Up:", value: `${(userXP.level - 1).toString()} --> ${userXP.level}` },
            { name: "Derzeitiges Level:", value: userXP.level.toString() },
            { name: "Nächstes Level:", value: (userXP.level + 1).toString() },
            { name: "Derzeitige XP:", value: userXP.xp.toString() },
            { name: "Benötigte XP:", value: xpToNextLevel.toString() },
            { name: "Fehlende XP:", value: fehlendeXP.toString() },
            { name: "ProgressBar:", value: progressBar }
        ])
        .setTimestamp();


    //Badge-System
    //Hinzufügen
    let badgeFile = "";
    let badgeName = "";
    let role;
    const member = msg.guild.members.cache.get(user.id);

    for(const badge of badgeLevelconfig) {
        if(userXP.level === badge.level) {
            badgeFile = path.join("./badges", badge.fileName);
            badgeName = badge.name;
            role = utils.getRole(member, badge.roleIDs[msg.guild.id]);
            if(role) member.roles.add(role);
        }
    }

    const file = new Discord.AttachmentBuilder(badgeFile);

    const channel = utils.findXpChannel(msg, config.xpChannel);
    channel?.send({ content: `Glückwunsch, ${user}`, embeds: [levelUp] })
        .then(() => {
            if(utils.checkArrayEmpty(badgeFile)) return;
            
            let role_str;
            if(role) {
                role_str = `**${role.name}**`;
            } else {
                role_str = "*Rolle nicht verfügbar*";
            }
            channel?.send({
                content: `Tolle Leistung, ${user}! Du hast gerade das Badge **${badgeName}** und die Rolle ${role_str} bekommen! Rufe deine Badges mit ${guildPrefix}badges ab.`,
                //embeds: [badgeEarned],
                files: [file]
            });
        });
}

function LvlAlg(lvl) {
    return Math.floor(0.5 * Math.pow(lvl, 2) + 10 * lvl + 100);
}

//Abfrage

exports.earnedBadges = function(msg, user) {
    const userXP = utils.getXP(msg, user);

    let earnedBadges = [];

    for(const badge of badgeLevelconfig) {
        if(userXP.level >= badge.level) {
            earnedBadges.push(badge);
        }
    }

    function compareLevels(a, b) {
        return b.level - a.level;
    }
    return earnedBadges.sort(compareLevels);
};
