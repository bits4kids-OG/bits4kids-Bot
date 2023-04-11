const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const utils = require("../utils.js");
const config = require("../config.json");
const fetch = require("node-fetch");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wetter")
        .setDescription("Zeigt das Wetter für einen Standort an."),
    async execute(msg, args, client, guildPrefix) {
        try {
            if (!args[0]) {
                msg.reply(`Benutzung: ${guildPrefix}wetter <Ort>\nBeispiel: ${guildPrefix}wetter Graz`);
                return;
            }
            const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?APPID=${config.OpenWeatherMapAPI}&units=metric&q=${args.join(" ")}`);
            const wetter = await response.json();
            const fahrenheit = ((wetter.main.temp * 9) / 5 + 32).toFixed(2);
            const mph = (wetter.wind.speed * 2.23693629205).toFixed(1);

            const embed = new Discord.EmbedBuilder()
                .setColor(utils.randomColor())
                .setTitle(`Wetter von ${wetter.name}, ${wetter.sys.country}:`)
                .setDescription(wetter.weather[0].main)
                .setThumbnail("https://openweathermap.org/img/w/${wetter.weather[0].icon}.png")
                .addFields([
                    { name: "Weather Description", value: wetter.weather[0].description },
                    { name: "Temperature", value: `${wetter.main.temp} °C / ${fahrenheit} °F` },
                    { name: "Wind speed", value: `${wetter.wind.speed} meter/sec  /  ${mph} mph` },
                    { name: "Pressure", value: `${wetter.main.pressure} hPa` },
                    { name: "Humidity", value: `${wetter.main.humidity}%` },
                    { name: "Cloudiness", value: `${wetter.clouds.all}%` }
                ])
                .setTimestamp()
                .setFooter({
                    text: "Data from OpenWeatherMap",
                    iconURL: "https://upload.wikimedia.org/wikipedia/commons/1/15/OpenWeatherMap_logo.png"
                });

            msg.reply({ embeds: [embed] });
        } catch (error) {
            if (error.statusCode == 404) {
                msg.reply("Ort nicht gefunden!");
            } else {
                msg.reply("Ein Error ist beim Zugreifen auf die OpenWatherMap API aufgetreten!");
                console.log(error);
            }
        }
    },
};