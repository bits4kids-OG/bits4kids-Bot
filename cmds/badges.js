const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

const xp_levels = require("../xp-and-levels.js");

const badgeLevelconfig = require("../badgeLevelconfig.json")["badges"];

const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("badges")
        .setDescription("Zeigt dir deine bereits erhaltenen Badges an.")
        .setDefaultPermission(false),
    async execute(msg, args, client) {
        if(args[0] && msg.mentions.users.first()) {
            if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
                msg.author.send("Das darfst du nicht machen!");
                return;
            }
            const user = msg.mentions.users.first();
            if (user.id === client.user.id) {
                msg.reply("The bot can't have Badges!");
                return;
            }
            let member = msg.guild.members.cache.get(user.id);
            if(!member) member = await msg.guild.members.fetch(user.id).catch(console.error);
            if(member.roles && utils.checkIfTrainer(member.roles.cache) === true) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }
            msg.reply({ embeds: [BadgeScreen(msg, user)] });

        } else {
            const author = msg.author;
            if(msg.member.roles && utils.checkIfTrainer(msg.member.roles.cache) === true) {
                msg.reply("Error: Trainer:innen können keine XP besitzen.");
                return;
            }
            msg.reply({ embeds: [BadgeScreen(msg, author)] })
                .then(() => {
                    const earnedBadges = xp_levels.earnedBadges(msg, author);
                    if(utils.checkArrayEmpty(earnedBadges)) return;
                    const earnedBadges_last = earnedBadges.shift();

                    const file = new Discord.AttachmentBuilder(path.join("./badges", earnedBadges_last.fileName));

                    msg.reply({
                        content: `Dein zuletzt erhaltenes Badge: **${earnedBadges_last.name}**`,
                        files: [file]
                    });
                });
        }


        function BadgeScreen(msg, user) {
            const earnedBadges = xp_levels.earnedBadges(msg, user);
            let nextBadge;
            if(earnedBadges.length === badgeLevelconfig.length) {
                nextBadge = { name: "Du hast bereits alle Badges!", level: "Du hast bereits alle Badges!" };
            } else {
                nextBadge = badgeLevelconfig[earnedBadges.length];
            }
        
            const userXP = utils.getXP(msg, user);
            
            let progressBar;
            if(isNaN(nextBadge.level)) {
                progressBar = utils.Progressbar(userXP.level, userXP.level, 24);
            } else {
                progressBar = utils.Progressbar(userXP.level, nextBadge.level, 24);
            }
            
            const badgeEarned = new Discord.EmbedBuilder()
                .setColor(utils.randomColor())
                .setTitle(`Badges von ${user.username}:`)
                .setDescription("Badges erhältst du ab einem bestimmten Level.")
                .setThumbnail(user.avatarURL());
            if(utils.checkArrayEmpty(earnedBadges)) {
                earnedBadges.push({ name: "Du hast noch keine Badges erhalten!" });
            }
            let badgesString = "";
            for(const badge of earnedBadges) {
                badgesString = badgesString + badge.name + "\n";
            }
            badgeEarned.addFields([
                { name: "Bisher erhaltene Badges:", value: badgesString },
                { name: "Nächstes Badge:", value: nextBadge.name },
                { name: "Benötigtes Level:", value: nextBadge.level.toString() },
                { name: "Derzeitiges Level:", value: userXP.level.toString() },
                { name: "ProgressBar zum nächsten Badge:", value: progressBar }
            ])
                .setTimestamp();
            return badgeEarned;
        }
        
    },
};