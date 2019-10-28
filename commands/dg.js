module.exports = {
  name: 'dg',
  description: "Find the degrees of failure or success, for the lazy.",
  execute(message) {
    const args = message.content.split(' ');
    if(args.length != 3){
      message.channel.send('You have called the function improperly! Example: `dof [DC] [Roll]');
    }else {
      var keyword;
      if(args[1] > args[2]){
        keyword = "failure";
      } else {
        keyword = "success";
      }
      var degrees = Math.ceil(Math.abs(args[1] - args[2]) / 5);
      return message.channel.send(`${degrees} degrees of ${keyword}`);
    }
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
    if (!serverQueue) return message.channel.send('There is no song that I could skip!');
    serverQueue.connection.dispatcher.end();
  },
};