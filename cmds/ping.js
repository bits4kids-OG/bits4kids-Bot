const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Der Bot antwortet mit Pong!"),
	execute(msg) {
        msg.reply("Pong!");
	},
};