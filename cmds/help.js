const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Zeigt die Hilfe-Seite für den Bot an."),
    execute(msg, args, client, guildPrefix) {
        if (args[0] && args[0] === "admin") {
            if (!msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES)) {
                msg.author.send("Das darfst du nicht machen!");
                return;
            }
            msg.reply("Sent you a DM!");
            const help = new Discord.MessageEmbed()
                .setColor(utils.randomColor())
                .setTitle(`Admin-Hilfe für den bits4kids Bot: (Für normale Commands -> ${guildPrefix}help`)
                .setThumbnail(client.user.avatarURL())
                .addField("Levelsystem", "\u200b")
                .addField(`${guildPrefix}xp`, `Zeigt die gespeicherten XP und Levels eines einzelnen Benutzer auf diesem Server an. Benötigt die Berechtigung "Manage Roles". Korrekte Benutzung: ${guildPrefix}xp @user`, true)
                .addField(`${guildPrefix}showxp`, "Zeigt die gespeicherten XP und Levels für alle Benutzer auf diesem Server an. Als Output wird eine Excel-Datei erzeugt. Benötigt die Berechtigung \"Manage Roles\".", true)
                .addField(`${guildPrefix}addxp`, "Gibt einem Benutzer eine bestimmte Anzahl an xp. Benötigt die Berechtigung \"Manage Roles\".", true)
                .addField(`${guildPrefix}setlevel`, `ACHTUNG: Dieser Command vergibt keine Badges; Benutze stattdessen ${guildPrefix}levelup oder ${guildPrefix}addxp. Setzt einen Benutzer auf das angegebene xp-Level. Benötigt die Berechtigung "Manage Roles".`, true)
                .addField(`${guildPrefix}levelup`, "Setzt einen Benutzer auf das nächste xp-Level. Benötigt die Berechtigung \"Manage Roles\".", true)
                .addField(`${guildPrefix}xptimeout`, `Sperrt den angegebenen User vom XP System, es kann jedoch manuell immer noch XP hinzugefügt werden. Benötigt die Berechtigung "Manage Roles". Korrekte Benutzung: ${guildPrefix}xptimeout @user <Dauer der Sperre in Tagen>\nBeispiel: ${guildPrefix}xptimeout @bits4kids 5\nTimeouts können mit ${guildPrefix}showxp eingesehen werden. Um ein timeout zu beenden, diesen Befehl mit 0 Tagen ausführen.`, true)

                .addField("\u200b", "\u200b")
                .addField("Invitesystem", "\u200b")
                .addField(`${guildPrefix}inviteconnect`, "Verknüpft einen Invite-Link oder nur den Code mit einer Rolle. Entweder den Namen der Rolle eingeben, oder die ID kopieren. Joint jemand mit diesem Invite, bekommt er automatisch die richtige Rolle zugewiesen. Wird der Befehl ohne Argumente ausgeführt, erscheint eine Vorlage zur korrekten Benutzung. Benötigt die Berechtigung \"Manage Server\".", true)
                .addField(`${guildPrefix}button`, "Erstellt und Verknüpft einen Button mit einer Rolle. Wird der Befehl ohne Argumente ausgeführt, erscheint eine Vorlage zur korrekten Benutzung. Benötigt die Berechtigung \"Manage Server\".", true)
                .addField(`${guildPrefix}showbeginners`, "Zeigt die gespeicherten Beginner auf diesem Server an. Die Aktualisierung der Datenbank erfolgt erst beim Beitritt des jewiligen Users zu einem Coding Club. Als Output wird eine Excel-Datei erzeugt. Benötigt die Berechtigung \"Manage Roles\".", true)
                .addField(`${guildPrefix}pending`, "Zeigt an, welche Benutzer zwar auf dem Server sind, aber noch nicht die Regeln akzeptiert haben. Benötigt die Berechtigung \"Manage Server\".", true)
                .addField(`${guildPrefix}refresh`, "Wenn neue Invites erstellt werden, muss dieser Command ausgeführt werden, bevor man eine Rolle verbinden kann. Der Command muss auch ausgeführt werden, wenn eine Datei für die Invitelinks oder Buttons verändert wurde. Benötigt die Berechtigung \"Manage Server\".", true)

                .addField("\u200b", "\u200b")
                .addField("Interaktion mit Teilnehmer:innen", "\u200b")
                .addField(`${guildPrefix}gamejam`, `Schaltet die GameJam Kategorie auf dem bits4kids-Server für alle sichtbar/unsichtbar.\nBenutzung: ${guildPrefix}gamejam start oder ${guildPrefix}gamejam stop oder ${guildPrefix}gamejam status.\nBenötigt die Berechtigung "Manage Roles".`, true)
                .addField(`${guildPrefix}umfrage`, "Fügt der vorherigen Nachricht Emojis als Umfrage hinzu. Benötigt die Berechtigung \"Manage Roles\".", true)

                .addField("\u200b", "\u200b")
                .addField("Wartung des Bots", "\u200b")
                .addField(`${guildPrefix}help admin`, "Lädt diese Seite. Benötigt die Berechtigung \"Manage Server\".", true)
                .addField(`${guildPrefix}reboot`, "Startet den Bot neu. Benötigt die Berechtigung \"Owner\" -> emeraldingg anschreiben", true)
                .addField(`${guildPrefix}announce`, "Schreibt auf jeden Server eine Nachricht, auf der der Bot drauf ist. Benötigt die Berechtigung \"Owner\" -> emeraldingg anschreiben", true)                
                .addField(`${guildPrefix}changePresence`, "Ändert den Status des Bots (sieht man auf der Seite). Wird nach einem Neustart zurückgesetzt und gilt für alle Server. Benötigt die Berechtigung \"Owner\" -> emeraldingg anschreiben", true)
                .addField(`${guildPrefix}changePrefix`, "Ändert den Prefix für den aktuellen Server. Die Hilfeseiten werden angepasst. Benötigt die Berechtigung \"Manage Server\".", true);
            msg.author.send({ embeds: [help] });
            return;
        }
            
        msg.reply("Hier findest du die Hilfe:");
        const help = new Discord.MessageEmbed()
            .setColor(utils.randomColor())
            .setTitle("Hilfe für den bits4kids Bot:")
            .setThumbnail(client.user.avatarURL())
            .addField(`${guildPrefix}blackjack`, "Spiele Blackjack mit dem Bot als Dealer.")
            .addField(`${guildPrefix}help`, "Lädt diese Seite.")
            .addField(`${guildPrefix}about`, "Zeigt Informationen zu diesem Bot.")
            .addField(`${guildPrefix}zufallszahl`, `Erstellt eine Zufallszahl. Korrekte Benutzung: ${guildPrefix}zufallszahl <höchste Zahl> oder ${guildPrefix}zufallszahl <niedrigste Zahl> <höchste Zahl>`)
            .addField(`${guildPrefix}collatz`,`Berechnet die Collatz Kurve für die angegebene Zahl. Korrekte Benutzung: ${guildPrefix}collatz <Zahl von 1-30>`)
            .addField(`${guildPrefix}katze`, "Zeigt eine zufällige Katze von www.random.cat. an.")
            .addField(`${guildPrefix}ping`, "Der Bot antwortet mit Pong.")
            .addField(`${guildPrefix}wetter`, `Der Bot zeigt das Wetter für den angegebenen Standort an. Korrekte Benutzung: ${guildPrefix}wetter <Standort>`)

            .addField(`${guildPrefix}xp`, "Zeigt dein aktuelles Level und xp an.")
            .addField(`${guildPrefix}badges`, "Zeigt dir deine erhaltenen Badges an.")

            .addField(`${guildPrefix}stats`, "Zeigt ein paar Statistiken zum Bot.");
        msg.reply({ embeds: [help] });
    },
};