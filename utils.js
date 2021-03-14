const { get } = require("https");

module.exports.filter = function filter(content) {
	if (!content) return "";
	var text = content.toString();
	text = text.split("@everyone");
 	text = text.join("@~~everyone~~");
 	text = text.split("@here");
 	text = text.join("@~~here~~");
 	return text;
};

module.exports.getFileURL = function getFileURL(ctx) {
	return new Promise((res, rej) => {
		var message = ctx.update.message;
		// First, we check photos.
		var photo = message.photo;
		// If there's no photo
		if (!photo) {
			var file = message.document || message.audio || message.voice || message.animation || message.video || message.videonote || message.video_note;
			if (!file) return rej("NO_ATTACHMENT");
			getFileLink(ctx, file.file_id).then(res).catch(rej);
		} else if (photo) {
			// if there's a photo, Fetch the highest one.
			var id = photo[photo.length-1].file_id;
			// Get the file URL from File ID.
			return getFileLink(ctx, id).then(res).catch(rej);
		}
	});
};

module.exports.send = function send(ctx, discord, text) {
	discord.channels.fetch(process.env.CHANNEL_ID).then(channel => {
        // Get telegram user avatar
	ctx.telegram.getUserProfilePhotos(ctx.message.from.id).then(e => {
	var id = e.photos[0][0].file_id;
	// Get the file id and get the attachment link
	ctx.telegram.getFileLink(id).then(url =>{

		/*
			We made two types of sending nessage to Discord.
			First, is embed, and second, webhook.

			Webhook only works if the bots has MANAGE_WEBHOOKS permisson.
		*/
		if (channel.guild.me.hasPermission("MANAGE_WEBHOOKS") === false) {
			if (text.includes("discord.gg")||text.includes("invite.gg")) {
			  	return ctx.reply("We do not allow any discord link here.");
		 	}
			if (typeof text === "object") {
                                return channel.send(ctx.message.from.first_name+": "+text.caption, text.file).catch(console.error);
                        }
			get(url, stream => {
				var attachment = new MessageAttachment(stream, 'avatar.jpg');
				// Because telegram file url includes telegram bots token, We generate another URL.
				channel.send(attachment).then(e => {
			 	       let embed = new MessageEmbed()
				       .setAuthor(ctx.message.from.first_name, e.attachments.first().proxyURL)
				       .setDescription(ctx.message.text)
				       .setColor("RANDOM");
				       channel.send(embed).then(() => e.delete()).catch(error => { console.error(error);e.delete() });}).catch(console.error);
			}).on('error', console.error);
		} else {

		channel.fetchWebhooks(require("fs").readFileSync("WebhookID").toString()).then(webhooks => {
			var webhook = webhooks.first();
			if (!webhook) channel.createWebhook("Telegram User").then(createdWebhook => {
				require("fs").writeFileSync("WebhookID", createdWebhook.id);
			   	if (text.includes("discord.gg")||text.includes("invite.gg")) {
			  		return ctx.reply("We do not allow any discord link here.");
			   	}
			   	if ( typeof text === "object" ) return createdWebhook.send(text.caption, {
				  username: ctx.message.from.first_name,
		 		  avatarURL: url,
			 	  files:[text.file]
			  	}).catch(console.error);
				return createdWebhook.send(filter(text), {
				  username: ctx.message.from.first_name,
			 	  avatarURL: url
			  	}).catch(console.error);
			});
			if ( typeof text === "object" ) return webhook.send(text.caption, {
				username: ctx.message.from.first_name,
				avatarURL: url,
				files:[text.file]
			}).catch(console.error);
			webhook.send(text, {
				username: ctx.message.from.first_name,
				avatarURL: url
			}).catch(console.error);
		}).catch(console.error);
	}

	}).catch(console.error);
	}).catch(console.error);
	}).catch(console.error);
};

function getFileLink(ctx, id) {
	return new Promise((res, rej) => {
		ctx.tg.getFileLink(id).then(response => {
			res(response);
		}).catch(rej);
	});
};

function getStream(url) {
	return new Promise((res, rej) => {
		return get(url, res).on('error', rej);
	});
};
