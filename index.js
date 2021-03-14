const { filter, getFileURL, send, getStream } = require("./utils");
const telegraf = require("telegraf").Telegraf;
const telegram = new telegraf(process.env.TELEGRAM_TOKEN);
const { Client, MessageEmbed, MessageAttachment } = require("discord.js");
const discord = new Client();

// Here is where discord bot Begins.

discord.on("message", (message) => {
	if (message.channel.id !== process.env.CHANNEL_ID) return;
	if (message.author.id === discord.user.id) return;
	if (message.webhookID) return;
	if (message.attachments.size > 0) {
		telegram.telegram.sendDocument(process.env.CHAT_ID, message.attachments.first().proxyURL).catch(console.error);
	}
	telegram.telegram.sendMessage(process.env.CHAT_ID, `${message.author.tag}: ${message.content}`, undefined, "reply_markup").catch(console.error);
});


discord.login(process.env.DISCORD_TOKEN);
// Here is where telegram bot Begins.

telegram.on("message", function (ctx) {
	var message = ctx.update.message;
	var text = message.text || message.caption || "";
	if (ctx.message.chat.id.toString() !== process.env.CHAT_ID.toString()) return;
	if (ctx.message.from.is_bot) return;
	if (text.startsWith("/") && text.length > 1) return;
	getFileURL(ctx).then(response => {
		var attachment = new MessageAttachment(response.href, response.file_name);
		send(ctx, discord, { caption: text, file: attachment, url:response.href });
	}).catch(reason => {
		// If it's not because no attachment, Log it instead of sending message
		if (reason !== "NO_ATTACHMENT") return console.error(reason);
		send(ctx, discord, filter(text));
	});
});

// Handle all telegram error.
telegram.catch(console.error);
telegram.launch();
