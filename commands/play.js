const {
	Util
} = require('discord.js');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');

module.exports = {
	name: 'play',
	description: 'Play a song in your channel!',
	async execute(message) {
		const args = message.content.split(' ');
		const queue = message.client.queue;
		const serverQueue = message.client.queue.get(message.guild.id);

		const voiceChannel = message.member.voiceChannel;
		if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music!');
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			return message.channel.send('I need the permissions to join and speak in your voice channel!');
		}


		//Identify if args is a yt playlist url, and if so do differnt logic
		if(ytpl.validateURL(args[1])){
			//playlist logic
			const playlistInfo = await ytpl(args[1], 0);

			if (!serverQueue) {
				const queueContruct = {
					textChannel: message.channel,
					voiceChannel: voiceChannel,
					connection: null,
					songs: [],
					volume: 5,
					playing: true,
				};

				queue.set(message.guild.id, queueContruct);

				for(playListItem of playlistInfo.items){
					const song = {
						title: playListItem.title,
						url: playListItem.url_simple,
					};
					queueContruct.songs.push(song);
				}

				try {
					var connection = await voiceChannel.join();
					queueContruct.connection = connection;
					this.play(message, queueContruct.songs[0]);
				} catch (err) {
					console.log(err);
					queue.delete(message.guild.id);
					return message.channel.send(err);
				}
			} else {
				for(playListItem of playlistInfo.items){
					const song = {
						title: playListItem.title,
						url: playListItem.url_simple,
					};
					serverQueue.songs.push(song);
				}
				
				return message.channel.send(`${playlistInfo.title} has been added to the queue! (${playlistInfo.total_items} added)`);
			}
		} else {
			//single song logic
			const songInfo = await ytdl.getInfo(args[1]);
			const song = {
				title: songInfo.title,
				url: songInfo.video_url,
			};

			if (!serverQueue) {
				const queueContruct = {
					textChannel: message.channel,
					voiceChannel: voiceChannel,
					connection: null,
					songs: [],
					volume: 5,
					playing: true,
				};

				queue.set(message.guild.id, queueContruct);

				queueContruct.songs.push(song);

				try {
					var connection = await voiceChannel.join();
					queueContruct.connection = connection;
					this.play(message, queueContruct.songs[0]);
				} catch (err) {
					console.log(err);
					queue.delete(message.guild.id);
					return message.channel.send(err);
				}
			} else {
				serverQueue.songs.push(song);
				return message.channel.send(`${song.title} has been added to the queue!`);
			}
		}
	},

	play(message, song) {
		const queue = message.client.queue;
		const guild = message.guild;
		const serverQueue = queue.get(message.guild.id);
	
		if (!song) {
			serverQueue.voiceChannel.leave();
			queue.delete(guild.id);
			return;
		}
	
		const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
			.on('end', () => {
				console.log('Music ended!');
				serverQueue.songs.shift();
				this.play(message, serverQueue.songs[0]);
			})
			.on('error', error => {
				console.error(error);
			});
		dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	}
};