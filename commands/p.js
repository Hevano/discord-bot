const {
	Util
} = require('discord.js');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const playlists = require('../playlists.json');

module.exports = {
	name: 'p',
	description: 'Play a Space Western playlist in your channel!',
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

		//Load playlist url from json
		if(!playlists.hasOwnProperty(args[1])){
			var url = playlists["default"];
		} else{
			var url = playlists[args[1]];
		}

		const playlistInfo = await ytpl(url, 0);

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

			var j, x, i;
	    for (i = queueContruct.songs.length - 1; i > 0; i--) {
	        j = Math.floor(Math.random() * (i + 1));
	        x = queueContruct.songs[i];
	        queueContruct.songs[i] = queueContruct.songs[j];
	        queueContruct.songs[j] = x;
	    }

			try {
				var connection = await voiceChannel.join();
				queueContruct.connection = connection;
				message.channel.send(`Playing playlist ${playlistInfo.title}! (${playlistInfo.total_items} added)`);
				this.play(message, queueContruct.songs[0]);
			} catch (err) {
				console.log(err);
				queue.delete(message.guild.id);
				return message.channel.send(err);
			}
		} else {
			serverQueue.songs = [];
			for(playListItem of playlistInfo.items){
				const song = {
					title: playListItem.title,
					url: playListItem.url_simple,
				};
				serverQueue.songs.push(song);
			}
			var j, x, i;
	    for (i = serverQueue.songs.length - 1; i > 0; i--) {
	        j = Math.floor(Math.random() * (i + 1));
	        x = serverQueue.songs[i];
	        serverQueue.songs[i] = serverQueue.songs[j];
	        serverQueue.songs[j] = x;
	    }
			
			return message.channel.send(`${playlistInfo.title} has been added to the queue! (${playlistInfo.total_items} added)`);
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