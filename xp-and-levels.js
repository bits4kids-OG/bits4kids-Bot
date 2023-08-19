const Discord = require("discord.js");
const utils = require("./utils.js");
const config = require("./config.json");

const fs = require("fs");

//Dateinamen geordnet laut aufsteigender Levelanzahl
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
            if(err) console.log(err);
        });
        nextLevel(msg, user, guildPrefix);
    }
    fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
        if(err) console.log(err);
    });
};

exports.removeXP = function(msg, user, number, guildPrefix) {
    const XP = utils.getXP(msg, user);
    const userXP = XP[msg.guild.id][user.id];

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
    fs.writeFileSync("./xp.json", JSON.stringify(XP, null, 2), err => {
        if(err) console.log(err);
    });
    if(levelDowngrade === true) nextLevel(msg, user, guildPrefix);
};

//Abfrage nach XP durch den Benutzer

exports.xpInfoScreen = function(msg, user) {
    const userXP = utils.getXP(msg, user)[msg.guild.id][user.id];

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

exports.levelUp = function(msg, user, guildPrefix) {
    nextLevel(msg, user, guildPrefix);
};

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

    //console.log(Badges);

    //Badge-System
    //Hinzufügen
    let badge = "";
    let role;
    const member = msg.guild.members.cache.get(user.id);

    if(userXP.level === Lvl150Lvl) {
        badge = "./badges/" + Badges[5];

        role = utils.getRole(member, Lvl150Role);
        if(role) member.roles.add(role);

    } else if(userXP.level === Lvl100Lvl) {
        badge = "./badges/" + Badges[4];

        role = utils.getRole(member, Lvl100Role);
        if(role) member.roles.add(role);

    } else if(userXP.level === Lvl50Lvl) {
        badge = "./badges/" + Badges[3];

        role = utils.getRole(member, Lvl50Role);
        if(role) member.roles.add(role);

    } else if(userXP.level === Lvl20Lvl) {
        badge = "./badges/" + Badges[2];

        role = utils.getRole(member, Lvl20Role);
        if(role) member.roles.add(role);

    } else if(userXP.level === Lvl10Lvl) {
        badge = "./badges/" + Badges[1];

        role = utils.getRole(member, Lvl10Role);
        if(role) member.roles.add(role);

    } else if(userXP.level === Lvl5Lvl) {
        badge = "./badges/" + Badges[0];

        role = utils.getRole(member, Lvl5Role);
        if(role) member.roles.add(role);
    }

    //console.log(badge);

    const file = new Discord.AttachmentBuilder(badge);

    const channel = utils.findXpChannel(msg, config.xpChannel);
    channel?.send({ content: `Glückwunsch, ${user}`, embeds: [levelUp] })
        .then(() => {
            if(utils.checkArrayEmpty(badge)) return;
            
            let role_str;
            if(role) {
                role_str = `**${role.name}**`;
            } else {
                role_str = "*Rolle nicht verfügbar*";
            }
            channel?.send({
                content: `Tolle Leistung, ${user}! Du hast gerade ein Badge und die Rolle ${role_str} bekommen! Rufe deine Badges mit ${guildPrefix}badges ab.`,
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
};

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

    let nextBadgeLevel = [nextBadge, level];
    return nextBadgeLevel;
};
