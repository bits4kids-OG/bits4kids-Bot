const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

const xp_levels = require("../xp-and-levels.js");
const config = require("../config.json");

const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("badges")
        .setDescription("Zeigt dir deine bereits erhaltenen Badges an.")
        .setDefaultPermission(false),
    execute(msg, args, client) {
        if(args[0] && msg.mentions.users.first()) {
            if (!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES)) {
                msg.author.send("Das darfst du nicht machen!");
                return;
            }
            const user = msg.mentions.users.first();
            if (user.id === client.user.id) {
                msg.reply("The bot can't have Badges!");
                return;
            }
            const trainRole = msg.guild.roles.cache.find(r => r.id === config.TrainerRolle);
            const orgRole = msg.guild.roles.cache.find(r => r.id === config.OrganisationRolle);
            const member = msg.guild.members.cache.get(user.id);
            if ((trainRole) && (orgRole) && (member.roles) && ((member.roles.cache.has(trainRole.id)) || (member.roles.cache.has(orgRole.id)))) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }
            msg.reply({ embeds: [BadgeScreen(msg, user)] });

        } else {
            const author = msg.author;
            const trainRole = msg.guild.roles.cache.find(r => r.id === config.TrainerRolle);
            const orgRole = msg.guild.roles.cache.find(r => r.id === config.OrganisationRolle);
            if ((trainRole) && (orgRole) && (msg.member.roles) && ((msg.member.roles.cache.has(trainRole.id)) || (msg.member.roles.cache.has(orgRole.id)))) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }
            msg.reply({ embeds: [BadgeScreen(msg, author)] })
                .then(() => {
                    const earnedBadges_last = xp_levels.earnedBadges(msg, author);
                    if(utils.checkArrayEmpty(earnedBadges_last)) return;

                    const file = new Discord.MessageAttachment(earnedBadges_last[0]);

                    msg.reply({
                        content: `Dein zuletzt erhaltenes Badge: ${(earnedBadges_last[0]).replace("./badges/", "").replace(".jpg", "").replace(".png", "")}`,
                        //embeds: [badgeEarned],
                        files: [file]
                    });
                });
        }


        function BadgeScreen(msg, user) {
            let earnedBadges = xp_levels.earnedBadges(msg, user);
            const nextBadge = xp_levels.nextBadge(msg, user);
        
            const userXP = utils.getXP(msg, user)[msg.guild.id][user.id];
            
            let progressBar;
            if(isNaN(nextBadge[1])) {
                progressBar = utils.Progressbar(userXP.level, userXP.level, 24);
            } else {
                progressBar = utils.Progressbar(userXP.level, nextBadge[1], 24);
            }
            
            const badgeEarned = new Discord.MessageEmbed()
                .setColor(utils.randomColor())
                .setTitle(`Badges von ${user.username}:`)
                .setDescription("Badges erhältst du ab einem bestimmten Level.")
                .setThumbnail(user.avatarURL());
            if(utils.checkArrayEmpty(earnedBadges)) {
                earnedBadges.push("Du hast noch keine Badges erhalten!");
            }
            let badgesString = "";
            for(let i = 0; i < earnedBadges.length; i++) {
                badgesString = badgesString + earnedBadges[i].replace("./badges/", "").replace(".jpg", "").replace(".png", "").toString() + "\n";
            }
            badgeEarned.addField("Bisher erhaltene Badges:", badgesString)
                .addField("Nächstes Badge:", nextBadge[0])
                .addField("Benötigtes Level:", nextBadge[1].toString())
                .addField("Derzeitiges Level:", userXP.level.toString())
                .addField("ProgressBar zum nächsten Badge:", progressBar)
                .setTimestamp();
            return badgeEarned;
        }
        
    },
};