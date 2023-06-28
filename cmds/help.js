const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Zeigt die Hilfe-Seite für den Bot an."),
    execute(msg, args, client, guildPrefix) {
        if (args[0] && args[0] === "admin") {
            if (!msg.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)) {
                msg.author.send("Das darfst du nicht machen!");
                return;
            }
            msg.reply("Sent you a DM!");
            const help = new Discord.EmbedBuilder()
                .setColor(utils.randomColor())
                .setTitle(`Admin-Hilfe für den bits4kids Bot: (Für normale Commands -> ${guildPrefix}help`)
                .setThumbnail(client.user.avatarURL())
                .addFields([
                    { name: "Levelsystem", value: "\u200b" },
                    { name: `${guildPrefix}xp`, value: `Zeigt die gespeicherten XP und Levels eines einzelnen Benutzer auf diesem Server an. Benötigt die Berechtigung "Manage Roles". Korrekte Benutzung: ${guildPrefix}xp @user`, inline: true },
                    { name: `${guildPrefix}showxp`, value: "Zeigt die gespeicherten XP und Levels für alle Benutzer auf diesem Server an. Als Output wird eine Excel-Datei erzeugt. Benötigt die Berechtigung \"Manage Roles\".", inline: true },
                    { name: `${guildPrefix}addxp`, value: "Gibt einem Benutzer eine bestimmte Anzahl an xp. Benötigt die Berechtigung \"Manage Roles\".", inline: true },
                    { name: `${guildPrefix}setlevel`, value: `ACHTUNG: Dieser Command vergibt keine Badges; Benutze stattdessen ${guildPrefix}levelup oder ${guildPrefix}addxp. Setzt einen Benutzer auf das angegebene xp-Level. Benötigt die Berechtigung "Manage Roles".`, inline: true },
                    { name: `${guildPrefix}levelup`, value: "Setzt einen Benutzer auf das nächste xp-Level. Benötigt die Berechtigung \"Manage Roles\".", inline: true },
                    { name: `${guildPrefix}xptimeout`, value: `Sperrt den angegebenen User vom XP System, es kann jedoch manuell immer noch XP hinzugefügt werden. Benötigt die Berechtigung "Manage Roles". Korrekte Benutzung: ${guildPrefix}xptimeout @user <Dauer der Sperre in Tagen>\nBeispiel: ${guildPrefix}xptimeout @bits4kids 5\nTimeouts können mit ${guildPrefix}showxp eingesehen werden. Um ein timeout zu beenden, diesen Befehl mit 0 Tagen ausführen.`, inline: true },

                    { name: "\u200b", value: "\u200b" },
                    {name: "Invitesystem", value: "\u200b" },
                    { name: `${guildPrefix}inviteconnect`, value: "Verknüpft einen Invite-Link oder nur den Code mit einer Rolle. Entweder den Namen der Rolle eingeben, oder die ID kopieren. Joint jemand mit diesem Invite, bekommt er automatisch die richtige Rolle zugewiesen. Wird der Befehl ohne Argumente ausgeführt, erscheint eine Vorlage zur korrekten Benutzung. Benötigt die Berechtigung \"Manage Server\".", inline: true },
                    { name: `${guildPrefix}button`, value: "Erstellt und Verknüpft einen Button mit einer Rolle. Wird der Befehl ohne Argumente ausgeführt, erscheint eine Vorlage zur korrekten Benutzung. Benötigt die Berechtigung \"Manage Server\".", inline: true },
                    { name: `${guildPrefix}showbeginners`, value: "Zeigt die gespeicherten Beginner auf diesem Server an. Die Aktualisierung der Datenbank erfolgt erst beim Beitritt des jewiligen Users zu einem Coding Club. Als Output wird eine Excel-Datei erzeugt. Benötigt die Berechtigung \"Manage Roles\".", inline: true },
                    { name: `${guildPrefix}pending`, value: "Zeigt an, welche Benutzer zwar auf dem Server sind, aber noch nicht die Regeln akzeptiert haben. Benötigt die Berechtigung \"Manage Server\".", inline: true },
                    { name: `${guildPrefix}refresh`, value: "Wenn neue Invites erstellt werden, muss dieser Command ausgeführt werden, bevor man eine Rolle verbinden kann. Der Command muss auch ausgeführt werden, wenn eine Datei für die Invitelinks oder Buttons verändert wurde. Benötigt die Berechtigung \"Manage Server\".", inline: true },

                    { name: "\u200b", value: "\u200b" },
                    { name: "Interaktion mit Teilnehmer:innen", value: "\u200b" },
                    { name: `${guildPrefix}gamejam`, value: `Schaltet die GameJam Kategorie auf dem bits4kids-Server für alle sichtbar/unsichtbar.\nBenutzung: ${guildPrefix}gamejam start oder ${guildPrefix}gamejam stop oder ${guildPrefix}gamejam status.\nBenötigt die Berechtigung "Manage Roles".`, inline: true },
                    { name: `${guildPrefix}umfrage`, value: "Fügt der vorherigen Nachricht Emojis als Umfrage hinzu. Benötigt die Berechtigung \"Manage Roles\".", inline: true },

                    { name: "\u200b", value: "\u200b" },
                    { name: "Wartung des Bots", value: "\u200b" },
                    { name: `${guildPrefix}help admin`, value: "Lädt diese Seite. Benötigt die Berechtigung \"Manage Server\".", inline: true },
                    { name: `${guildPrefix}reboot`, value: "Startet den Bot neu. Benötigt die Berechtigung \"Owner\" -> emeraldingg anschreiben", inline: true },
                    { name: `${guildPrefix}announce`, value: "Schreibt auf jeden Server eine Nachricht, auf der der Bot drauf ist. Benötigt die Berechtigung \"Owner\" -> emeraldingg anschreiben", inline: true },
                    { name: `${guildPrefix}changePresence`, value: "Ändert den Status des Bots (sieht man auf der Seite). Wird nach einem Neustart zurückgesetzt und gilt für alle Server. Benötigt die Berechtigung \"Owner\" -> emeraldingg anschreiben", inline: true },
                    { name: `${guildPrefix}changePrefix`, value: "Ändert den Prefix für den aktuellen Server. Die Hilfeseiten werden angepasst. Benötigt die Berechtigung \"Manage Server\".", inline: true }
                ]);
            msg.author.send({ embeds: [help] });
            return;
        }
            
        msg.reply("Hier findest du die Hilfe:");
        const help = new Discord.EmbedBuilder()
            .setColor(utils.randomColor())
            .setTitle("Hilfe für den bits4kids Bot:")
            .setThumbnail(client.user.avatarURL())
            .addFields([
                { name: `${guildPrefix}blackjack`, value: "Spiele Blackjack mit dem Bot als Dealer." },
                { name: `${guildPrefix}help`, value: "Lädt diese Seite." },
                { name: `${guildPrefix}about`, value: "Zeigt Informationen zu diesem Bot." },
                { name: `${guildPrefix}zufallszahl`, value: `Erstellt eine Zufallszahl. Korrekte Benutzung: ${guildPrefix}zufallszahl <höchste Zahl> oder ${guildPrefix}zufallszahl <niedrigste Zahl> <höchste Zahl>` },
                { name: `${guildPrefix}collatz`, value: `Berechnet die Collatz Kurve für die angegebene Zahl. Korrekte Benutzung: ${guildPrefix}collatz <Zahl von 1-30>` },
                { name: `${guildPrefix}katze`, value: `Zeigt eine zufällige Katze von www.cataas.com an.\nMit ${guildPrefix}katze <text> wird eine Katze mit einer Caption angezeigt. Bsp: ${guildPrefix}katze Guten Morgen!` },
                { name: `${guildPrefix}ping`, value: "Der Bot antwortet mit Pong." },
                { name: `${guildPrefix}wetter`, value: `Der Bot zeigt das Wetter für den angegebenen Standort an. Korrekte Benutzung: ${guildPrefix}wetter <Standort>` },
                
                { name: `${guildPrefix}xp`, value: "Zeigt dein aktuelles Level und xp an." },
                { name: `${guildPrefix}badges`, value: "Zeigt dir deine erhaltenen Badges an." },
                
                { name: `${guildPrefix}stats`, value: "Zeigt ein paar Statistiken zum Bot." }
            ]);
        msg.reply({ embeds: [help] });
    },
};