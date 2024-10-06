const utils = require("./utils.js");
const config = require("./config.json");
const lbConfig = require("./leaderboardConfig.json");

const fs = require("fs");

async function purgeBeginners(msg) {
    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;

    const beginners = utils.getBeginners(msg);
    const guildbeginners = beginners[msg.guild.id];

    const beginnerRole = utils.getRole(msg, config.BeginnerRolle);
    if(!beginnerRole) {
        msg.reply("Error: Beginner role was not found on this server.");
        return;
    }

    let beginnerCounter = {
        audited: 0,
        purged: 0,
    };

    await msg.guild.members.fetch();

    beginnerRole.members.forEach(member => {
        beginnerCounter.audited++;

        if(!(member.user.id in guildbeginners)) {
            if(member?.roles && member.roles.cache.has(beginnerRole.id)) {
                member.roles.remove(beginnerRole);
            }
            beginnerCounter.purged++;
        }
    });

    for(const beginnerId in guildbeginners) {
        const beginner = guildbeginners[beginnerId];
        beginnerCounter.audited++;

        if((beginner.joined) && ((Date.now() - beginner.joined) >= 4*week)) {
            if(msg.guild.members) {
                const member = msg.guild.members.cache.get(beginnerId) || await msg.guild.members.fetch(beginnerId).catch(console.warn);

                if(!member) continue;
                
                if(member?.roles && member.roles.cache.has(beginnerRole.id)) {
                    member.roles.remove(beginnerRole);
                }
                beginnerCounter.purged++;
                delete(beginners[member.guild.id][member.user.id]);
            }
        }
    }

    fs.writeFileSync("./beginners.json", JSON.stringify(beginners, null, 2), err => {
        if(err) console.log(err);
    });

    return beginnerCounter;
}

async function purgeDefaultBeginners(client, guildId = lbConfig.defaultGuildId) {
    let guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(console.error);
    if(!guild) return;
    const logChannel = utils.findLogChannel(guild);

    const beginnerCounter = await purgeBeginners({ guild, reply: console.warn });

    if(beginnerCounter) {
        logChannel?.send(`Audited ${beginnerCounter.audited} users and purged ${beginnerCounter.purged} beginners.`);
    } else {
        const msg = "Warning: No beginner purge possible on this guild.";
        console.warn(msg);
        logChannel?.send(msg);
    }
    
}

exports.purgeBeginners = purgeBeginners;
exports.purgeDefaultBeginners = purgeDefaultBeginners;