const Discord = require("discord.js");
const utils = require('./utils.js');
const config = require("./config.json");

const fs = require("fs");

const Badges = ["Rookie-Bot.png", "Advanced-Bot.png", "Industrie-Robo.png", "Robo-Köpfchen.png", "Robo-Kopf.png", "Mars-Robo.png"];

//Rollen
const Lvl5Role = "996722514698965003";
const Lvl5Lvl = 5;

const Lvl10Role = "996722646127493214";
const Lvl10Lvl = 10;

const Lvl20Role = "996722965976723476";
const Lvl20Lvl = 20;

const Lvl50Role = "996723053797060729";
const Lvl50Lvl = 50;

const Lvl100Role = "996723166141485098";
const Lvl100Lvl = 100;

const Lvl150Role = "996723230792482826";
const Lvl150Lvl = 150;


//Vergabe von XP-Punkten

exports.addXP = function(msg, user, number, guildPrefix) {
    const XP = utils.getXP(msg, user);
    const userXP = XP[msg.guild.id][user.id];

    userXP.xp += number;
    userXP.last_message = Date.now();
    
//Level

    let xpToNextLevel = LvlAlg(userXP.level);
    while(userXP.xp >= xpToNextLevel) {
        userXP.level ++;
        userXP.xp = userXP.xp - xpToNextLevel;
        xpToNextLevel = LvlAlg(userXP.level);
        fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
            if(err) console.log(err)
        });
        nextLevel(msg, user, guildPrefix);
    }
    fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
        if(err) console.log(err)
    });
}

//Abfrage nach XP durch den Benutzer

exports.xpInfoScreen = function(msg, user) {
    const userXP = utils.getXP(msg, user)[msg.guild.id][user.id];

    const xpToNextLevel = LvlAlg(userXP.level);

    const progressBar = utils.Progressbar(userXP.xp, xpToNextLevel, 24);


    const xpErgebnis = new Discord.MessageEmbed()
        .setColor(utils.randomColor())
        .setTitle(`XP-Level von ${user.username}`)
        .setDescription("Für jede Nachricht, die du bei uns am Server schreibst, bekommst du XP. Mit genügend XP kannst du ein Level aufsteigen und dir so Badges verdienen. Falls du noch Fragen zum Level-System hast, frage eine/einen von unseren Trainerinnen/Trainern :)")
        .setThumbnail(user.avatarURL());

            if(userXP.timeout >= Date.now()) {
                const timeoutDate = new Date(userXP.timeout)
                xpErgebnis.addField(`Timeout bis:`, `${timeoutDate.toLocaleString("en-GB")}`);
            }

        xpErgebnis.addField(`Derzeitiges Level:`, userXP.level.toString())
        .addField(`Nächstes Level:`, (userXP.level + 1).toString())
        .addField(`Derzeitige XP:`, userXP.xp.toString())
        .addField(`Benötigte XP:`, xpToNextLevel.toString())
        .addField(`Fehlende XP:`, (xpToNextLevel - userXP.xp).toString())
        .addField(`ProgressBar:`, progressBar)
        .setTimestamp();
    return xpErgebnis;
}

//Gratulation bei Level-Up

exports.levelUp = function(msg, user, guildPrefix) {
    nextLevel(msg, user, guildPrefix);
}

function nextLevel(msg, user, guildPrefix) {
    const userXP = utils.getXP(msg, user)[msg.guild.id][user.id];

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

    const levelUp = new Discord.MessageEmbed()
    .setColor(utils.randomColor())
    .setTitle(`${user.username} ist gerade ein Level aufgestiegen!`)
    .setDescription("Gratulation!")
    .setThumbnail(user.avatarURL())
    .addField(`Level-Up:`, `${(userXP.level - 1).toString()} --> ${userXP.level}`)
    .addField(`Derzeitiges Level:`, userXP.level.toString())
    .addField(`Nächstes Level:`, (userXP.level + 1).toString())
    .addField(`Derzeitige XP:`, userXP.xp.toString())
    .addField(`Benötigte XP:`, xpToNextLevel.toString())
    .addField(`Fehlende XP:`, fehlendeXP.toString())
    .addField(`ProgressBar:`, progressBar)
    .setTimestamp();

    //console.log(Badges);

//Badge-System
    //Hinzufügen
    let badge = "";
    let addedRole;

    if(userXP.level === Lvl150Lvl) {
        badge = "./badges/" + Badges[5];

            let role = utils.getRole(msg.member, Lvl150Role);
            if(role) msg.member.roles.add(role);
            addedRole = role;

    } else if(userXP.level === Lvl100Lvl) {
        badge = "./badges/" + Badges[4];

            let role = utils.getRole(msg.member, Lvl100Role);
            if(role) msg.member.roles.add(role);
            addedRole = role;

    } else if(userXP.level === Lvl50Lvl) {
        badge = "./badges/" + Badges[3];

            let role = utils.getRole(msg.member, Lvl50Role);
            if(role) msg.member.roles.add(role);
            addedRole = role;

    } else if(userXP.level === Lvl20Lvl) {
        badge = "./badges/" + Badges[2];

            let role = utils.getRole(msg.member, Lvl20Role);
            if(role) msg.member.roles.add(role);
            addedRole = role;

    } else if(userXP.level === Lvl10Lvl) {
        badge = "./badges/" + Badges[1];

            let role = utils.getRole(msg.member, Lvl10Role);
            if(role) msg.member.roles.add(role);
            addedRole = role;

    } else if(userXP.level === Lvl5Lvl) {
        badge = "./badges/" + Badges[0];

            let role = utils.getRole(msg.member, Lvl5Role);
            if(role) msg.member.roles.add(role);
            addedRole = role.name;
    }

    //console.log(badge);

    const file = new Discord.MessageAttachment(badge);

    const channel = utils.findChannel(msg, config.xpChannel);
    channel?.send({ content: `Glückwunsch, ${user}`, embeds: [levelUp] })
    .then(() => {
        if(utils.checkArrayEmpty(badge)) return;

        channel?.send({
            content: `Tolle Leistung, ${user}! Du hast gerade ein Badge und die Rolle ${addedRole} bekommen! Rufe deine Badges mit ${guildPrefix}badges ab.`,
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
    const userXP = utils.getXP(msg, user)[msg.guild.id][user.id];

    let earnedBadges = [];
    let badge = "";

    if(userXP.level >= Lvl150Lvl) {
        badge = "./badges/" + Badges[5];
        earnedBadges.push(badge);
    }
    if(userXP.level >= Lvl100Lvl) {
        badge = "./badges/" + Badges[4];
        earnedBadges.push(badge);
    }
    if(userXP.level >= Lvl50Lvl) {
        badge = "./badges/" + Badges[3];
        earnedBadges.push(badge);
    }
    if(userXP.level >= Lvl20Lvl) {
        badge = "./badges/" + Badges[2];
        earnedBadges.push(badge);
    }
    if(userXP.level >= Lvl10Lvl) {
        badge = "./badges/" + Badges[1];
        earnedBadges.push(badge);
    }
    if(userXP.level >= Lvl5Lvl) {
        badge = "./badges/" + Badges[0];
        earnedBadges.push(badge);
    }

    return earnedBadges;
}

exports.nextBadge = function(msg, user) {
    const userXP = utils.getXP(msg, user)[msg.guild.id][user.id];

    let nextBadge = "";
    let level = 0;

    if(userXP.level >= Lvl150Lvl) {
        nextBadge = "Du hast bereits alle Badges!";
        level = "Du hast bereits alle Badges!";
    } else if(userXP.level >= Lvl100Lvl) {
        nextBadge = Badges[5].replace(".jpg", "").replace(".png", "");
        level = Lvl150Lvl;
    } else if(userXP.level >= Lvl50Lvl) {
        nextBadge = Badges[4].replace(".jpg", "").replace(".png", "");
        level = Lvl100Lvl;
    } else if(userXP.level >= Lvl20Lvl) {
        nextBadge = Badges[3].replace(".jpg", "").replace(".png", "");
        level = Lvl50Lvl;
    } else if(userXP.level >= Lvl10Lvl) {
        nextBadge = Badges[2].replace(".jpg", "").replace(".png", "");
        level = Lvl20Lvl;
    } else if(userXP.level >= Lvl5Lvl) {
        nextBadge = Badges[1].replace(".jpg", "").replace(".png", "");
        level = Lvl10Lvl;
    } else if(userXP.level < Lvl5Lvl) {
        nextBadge = Badges[0].replace(".jpg", "").replace(".png", "");
        level = Lvl5Lvl;
    }

    let nextBadgeLevel = [nextBadge, level]
    return nextBadgeLevel;
}
