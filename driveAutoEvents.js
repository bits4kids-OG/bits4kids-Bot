const Discord = require("discord.js");
const utils = require("./utils.js");
const AllOCCconfig = require("./events/OCCconfig.json");

const OCCconfig = AllOCCconfig["OCCs"];

const path = require("path");
const fs = require("fs");

const {google} = require("googleapis");

//Vergabe von XP-Punkten

exports.getFiles = async function() {
    const scopes = ["https://www.googleapis.com/auth/drive.metadata.readonly"];

    const auth = new google.auth.GoogleAuth({keyFile: "./credentials.json", scopes: scopes});
    const drive = google.drive({ version: "v3", auth });

    const res = await drive.files.list({
        pageSize: 10,
        fields: "nextPageToken, files(id, name)",
    });
    const files = res.data.files;
    if (files.length === 0) {
        console.log("No files found.");
        return;
    }
  
    console.log("Files:");
    files.map((file) => {
        console.log(`${file.name} (${file.id})`);
    });
};

exports.getSpreadsheetInfo = function() {
    getSpreadsheetInfo();
};

exports.createEvents = async function(client) {
    const eventData = await getSpreadsheetInfo();

    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;

    let existingEvents = {};
    let logChannels = {};

    
    for(const eventIndex in eventData) {
        let event = eventData[eventIndex];
        if(event.scheduledStartTimestamp - Date.now() > 0) {
            const eventConfig = OCCconfig[event.club];
            if(!eventConfig) {
                console.log(`Skipping ${event.name}: no channel assigned. Supplied channel: ${event?.club}.`);
                continue;
            }
            let eventGuild = client.guilds.cache.get(eventConfig.guildId);
            if(!eventGuild) eventGuild = await client.guilds.fetch(eventConfig.guildId).catch(console.error);
            let eventChannel = eventGuild.channels.cache.find(channel => channel.name === eventConfig.channelName && !channel.parent.name.includes("Kanal-Friedhof"));
            if(!eventChannel) {
                await eventGuild.channels.fetch()
                    .then(channels => eventChannel = channels.find(channel => channel.name === eventConfig.channelName && !channel.parent.name.includes("Kanal-Friedhof")))
                    .catch(console.error);
                if(!eventChannel) {
                    console.log(`Skipping ${event.name}: no channel found.`);
                    continue;
                }
            }
            event.channelId = eventChannel.id;

            let alreadyCreated = false;

            if(!existingEvents[eventGuild.id]) {
                let discordEvents = await eventGuild.scheduledEvents.fetch();
                existingEvents[eventGuild.id] = Array.from(discordEvents.values()).filter(event => event.creator === client.user);
            }
            if(!logChannels[eventGuild.id]) {
                logChannels[eventGuild.id] = utils.findLogChannel(eventGuild);
                logChannels[eventGuild.id]?.send("**Automatic Event Management:**");
            }
            const logChannel = logChannels[eventGuild.id];
            
            for(const existingEvent of existingEvents[eventGuild.id]) {
                if(!event.id) {
                    if((existingEvent.creator === client.user)) {
                        let notCreated = false;
                        const checkForArguments = ["name", "scheduledStartTimestamp", "channelId"];
                        for(const arg in checkForArguments) {
                            if(event[checkForArguments[arg]] !== existingEvent[checkForArguments[arg]]) {
                                notCreated = true;
                            }
                        }
                        if(((event.scheduledEndTimestamp >= 0)) && (existingEvent.scheduledEndTimestamp)) {
                            if(event.scheduledEndTimestamp !== existingEvent.scheduledEndTimestamp) {
                                notCreated = true;
                            }
                        }
                        if(notCreated === false) {
                            logChannel?.send(`Updated the EventId from event *${event.name}* as it was deleted in the Sheets file.`);
                            alreadyCreated = true;
                            event.id = existingEvent.id;
                            await uploadEventID(event, existingEvent.id);
                        }
                    }
                }
                if((event.id) && (existingEvent.id === event.id)) {
                    alreadyCreated = true;
                    logChannel?.send(`Event *${event.name}* was already created.\nChecking for changes...`);
                    let needUpdate = false;
                    const checkForArguments = ["name", "description", "scheduledStartTimestamp", "channelId"];
                    for(const arg in checkForArguments) {
                        if(event[checkForArguments[arg]] !== existingEvent[checkForArguments[arg]]) {
                            logChannel?.send(`Update needed for ${checkForArguments[arg]}!`);
                            needUpdate = true;
                        }
                    }
                    if(((isNaN(event.scheduledEndTimestamp)) && (existingEvent.scheduledEndTimestamp)) || (((event.scheduledEndTimestamp >= 0)) && (!existingEvent.scheduledEndTimestamp))) {
                        logChannel?.send("Update needed for scheduledEndTimestamp!");
                        needUpdate = true;
                    } else if((event.scheduledEndTimestamp >= 0) && (existingEvent.scheduledEndTimestamp)) {
                        if(event.scheduledEndTimestamp !== existingEvent.scheduledEndTimestamp) {
                            logChannel?.send("Update needed for scheduledEndTimestamp!");
                            needUpdate = true;
                        }
                    }
                    if(needUpdate === true) {
                        if(event.scheduledStartTimestamp - Date.now() <= 1*week) {
                            let img = "";
                            if(event.thumbnailURL) {
                                img = event.thumbnailURL;
                            } else {
                                let imgPath = path.join("./events", eventConfig.imagefileName);
                                if((imgPath !== "events") && (fs.existsSync(imgPath))) img = imgPath;
                                
                            }
                            try {
                                await existingEvent.edit({
                                    name: event.name,
                                    scheduledStartTime: event.scheduledStartTimestamp,
                                    scheduledEndTime: event.scheduledEndTimestamp,
                                    description: event.description,
                                    channel: eventChannel,
                                    image: img
                                });
                                logChannel?.send(`Successfully edited the event *${event.name}*!`);
                            } catch (error) {
                                console.log(error);
                            }
                        } else {
                            await existingEvent.delete();
                        }
                    }
                    if(event.scheduledStartTimestamp - Date.now() > 1*week) {
                        await existingEvent.delete();
                    }
                }
            }

            try {
                if(alreadyCreated === true) {
                    //logChannel?.send(`Event *${event.name}* was already created.`);
                } else if(event.scheduledStartTimestamp - Date.now() <= 1*week) {
                    let img = "";
                    if(event.thumbnailURL) {
                        img = event.thumbnailURL;
                    } else {
                        let imgPath = path.join("./events", eventConfig.imagefileName);
                        if((imgPath !== "events") && (fs.existsSync(imgPath))) img = imgPath;
                    }
                    const event_manager = new Discord.GuildScheduledEventManager(eventGuild);
                    const new_event = await event_manager.create({
                        name: event.name,
                        scheduledStartTime: event.scheduledStartTimestamp,
                        scheduledEndTime: event.scheduledEndTimestamp,
                        description: event.description,
                        privacyLevel: Discord.GuildScheduledEventPrivacyLevel.GuildOnly,
                        entityType: Discord.GuildScheduledEventEntityType.Voice,
                        channel: eventChannel,
                        image: img
                    });
                    await uploadEventID(event, new_event.id);
                    logChannel?.send(`Created event *${event.name}*!`);
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

    for(const guildsIndex in AllOCCconfig.alwaysCheckGuilds) {
        let guild = client.guilds.cache.get(AllOCCconfig.alwaysCheckGuilds[guildsIndex]);
        if(!guild) guild = await client.guilds.fetch(AllOCCconfig.alwaysCheckGuilds[guildsIndex]).catch(console.error);
        if(!existingEvents[guild.id]) {
            let discordEvents = await guild.scheduledEvents.fetch();
            existingEvents[guild.id] = Array.from(discordEvents.values()).filter(event => event.creator === client.user);
        }
        if(!logChannels[guild.id]) {
            logChannels[guild.id] = utils.findLogChannel(guild);
            logChannels[guild.id]?.send("**Automatic Event Management:**");
        }
    }
    for(const guilds in existingEvents) {
        const logChannel = logChannels[guilds];
        logChannel?.send("Checking for deleted events...");
        for(const existingEvent of existingEvents[guilds]) {
            let eventExists = false;
            for(const eventIndex in eventData) {
                let event = eventData[eventIndex];
                if(event.id === existingEvent.id) {
                    eventExists = true;
                }
            }
            if(eventExists === false) {
                logChannel?.send(`*${existingEvent.name}* was deleted as it was not found in the Sheets file.`);
                await existingEvent.delete();
            }
        }
    }
};

exports.manualEventUpdate = async function(oldEvent, newEvent, client) {
    const logChannel = utils.findLogChannel(newEvent.guild);
    let needUpdate = [];
    const checkForArguments = ["name", "description", "scheduledStartTimestamp", "channelId"];
    for(const arg in checkForArguments) {
        if(oldEvent[checkForArguments[arg]] !== newEvent[checkForArguments[arg]]) {
            needUpdate.push(checkForArguments[arg]);
        }
    }
    if(((oldEvent.scheduledEndTimestamp) && (!newEvent.scheduledEndTimestamp)) || ((!oldEvent.scheduledEndTimestamp) && (newEvent.scheduledEndTimestamp))) {
        needUpdate.push("scheduledEndTimestamp");
    } else if((oldEvent.scheduledEndTimestamp >= 0) && (newEvent.scheduledEndTimestamp >= 0)) {
        if(oldEvent.scheduledEndTimestamp !== newEvent.scheduledEndTimestamp) {
            needUpdate.push("scheduledEndTimestamp");
        }
    }
    if(needUpdate.length === 0) {
        return;
    } else {
        const eventData = await getSpreadsheetInfo();
        const event = eventData.find(e => e.id === newEvent.id);
        if(!event) return;

        const eventConfig = OCCconfig[event.club];
        if(!eventConfig) {
            console.log(`Skipping ${event.name}: no channel assigned. Supplied channel: ${event?.club}.`);
            return;
        }
        let eventGuild = client.guilds.cache.get(eventConfig.guildId);
        if(!eventGuild) eventGuild = await client.guilds.fetch(eventConfig.guildId).catch(console.error);
        let eventChannel = eventGuild.channels.cache.find(channel => channel.name === eventConfig.channelName && !channel.parent.name.includes("Kanal-Friedhof"));
        if(!eventChannel) {
            await eventGuild.channels.fetch()
                .then(channels => eventChannel = channels.find(channel => channel.name === eventConfig.channelName && !channel.parent.name.includes("Kanal-Friedhof")))
                .catch(console.error);
        }
        event.channelId = eventChannel.id;
        if(!event.channelId) return;

        logChannel?.send(`Event *${newEvent.name}* was manually edited.\nUpdating Sheets file for:\n${needUpdate.join("\n")}`);


        const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

        const auth = new google.auth.GoogleAuth({keyFile: "./credentials.json", scopes: scopes});
        const service = google.sheets({version: "v4", auth});

        for(const updates in needUpdate) {
            if(event[needUpdate[updates]] === newEvent[needUpdate[updates]]) continue;
            let value;
            let cell = "";
            if(needUpdate[updates] === "channelId") {
                const club = Object.keys(OCCconfig).find(key => OCCconfig[key].channelName === newEvent.channel.name);
                if(!club) break;
                if(!event.thumbnailURL) {
                    let img = "";
                    let imgPath = path.join("./events", OCCconfig[club].imagefileName);
                    if((imgPath !== "events") && (fs.existsSync(imgPath))) img = imgPath;
                    try {
                        await newEvent.edit({
                            image: img
                        });
                        logChannel?.send(`Successfully edited the event thumbnail of event *${newEvent.name}*.`);
                    } catch (error) {
                        console.log(error);
                    }
                }
                value = club;
                cell = event.club_A1;
            } else if((needUpdate[updates] === "scheduledStartTimestamp") || (needUpdate[updates] === "scheduledEndTimestamp")) {
                let date = new Date(newEvent[needUpdate[updates]]);
                value = date.toLocaleString("de-AT").replace(",", "");
                cell = event[`${needUpdate[updates]}_A1`];
            } else {
                value = newEvent[needUpdate[updates]];
                cell = event[`${needUpdate[updates]}_A1`];
            }

            let values = [
                [
                    value
                ]
            ];
            const resource = {
                values,
            };
            try {
                const result = await service.spreadsheets.values.update({
                    spreadsheetId: AllOCCconfig.sheetsSpreadsheetId,
                    range: `Eingabe!${cell}`,
                    valueInputOption: "USER_ENTERED",
                    resource
                });
                console.log("%d cells updated.", result.data.updatedCells);
            } catch (err) {
                console.log(err);
            }
        }
    }
};

async function getSpreadsheetInfo() {
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

    const auth = new google.auth.GoogleAuth({keyFile: "./credentials.json", scopes: scopes});
    const service = google.sheets({version: "v4", auth});

    try {
        const result = await service.spreadsheets.values.get({
            spreadsheetId: AllOCCconfig.sheetsSpreadsheetId,
            range: "BotSpace!A1:I51"
        });
        const numRows = result.data.values ? result.data.values.length : 0;
        console.log(`${numRows} rows retrieved.`);
        //console.log(result.data.values);
        const data = getObjectByData(result.data.values, numRows);
        //console.log(data);
        return data;
    } catch (err) {
        console.log(err);
    }

    function getObjectByData(data, numRows) {
        let column_name = data[0].indexOf("Name");
        let column_scheduledStartTimestamp = data[0].indexOf("BOT_Start Zeit");
        let column_scheduledEndTimestamp = data[0].indexOf("BOT_End Zeit");
        let column_WRITEscheduledStartTimestamp = data[0].indexOf("Start Zeit");
        let column_WRITEscheduledEndTimestamp = data[0].indexOf("End Zeit");
        let column_description = data[0].indexOf("Beschreibung");
        let column_thumbnailOverwrite = data[0].indexOf("Thumbnail Overwrite URL");
        let column_club = data[0].indexOf("Coding Club");
        let column_id = data[0].indexOf("ID");
        let result = [];
        if ((column_name != -1) && (column_scheduledStartTimestamp != -1) && (column_scheduledEndTimestamp != -1) && (column_description != -1) && (column_thumbnailOverwrite != -1) && (column_club != -1) && (column_id != -1)) {
            for(let i=1; i<numRows; i++) {
                result.push({
                    name: data[i][column_name]?.trim(),
                    scheduledStartTimestamp: Date.parse(data[i][column_scheduledStartTimestamp]),
                    scheduledEndTimestamp: Date.parse(data[i][column_scheduledEndTimestamp]),
                    description: data[i][column_description]?.trim(),
                    club: data[i][column_club],
                    thumbnailURL: data[i][column_thumbnailOverwrite],
                    id: data[i][column_id],

                    name_A1: getA1Notation(i, column_name),
                    scheduledStartTimestamp_A1: getA1Notation(i, column_WRITEscheduledStartTimestamp),
                    scheduledEndTimestamp_A1: getA1Notation(i, column_WRITEscheduledEndTimestamp),
                    description_A1: getA1Notation(i, column_description),
                    club_A1: getA1Notation(i, column_club),
                    id_A1: getA1Notation(i, column_id)
                });
            }
        } else {
            console.log("Error! Didn't find one of the columns.");
        }
        return result;
    }
}

async function uploadEventID(createdEventData, id) {
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

    const auth = new google.auth.GoogleAuth({keyFile: "./credentials.json", scopes: scopes});
    const service = google.sheets({version: "v4", auth});

    let values = [
        [
            id
        ]
    ];
    const resource = {
        values,
    };
    try {
        const result = await service.spreadsheets.values.update({
            spreadsheetId: AllOCCconfig.sheetsSpreadsheetId,
            range: `Eingabe!${createdEventData.id_A1}`,
            valueInputOption: "RAW",
            resource
        });
        console.log("%d cells updated.", result.data.updatedCells);
        return result;
    } catch (err) {
        console.log(err);
    }
}

function getA1Notation(row, column) {
    const a1Notation = [`${row + 1}`];
    const totalAlphabets = "Z".charCodeAt() - "A".charCodeAt() + 1;
    let block = column;
    while (block >= 0) {
        a1Notation.unshift(String.fromCharCode((block % totalAlphabets) + "A".charCodeAt()));
        block = Math.floor(block / totalAlphabets) - 1;
    }
    return a1Notation.join("");
}