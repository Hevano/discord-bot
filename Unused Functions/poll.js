module.exports = {
	name: 'poll',
	description: 'Call a poll.',
	execute(message) {
    const args = message.content.split('|');
    var emoji = ["🇦","two","three","four","five","six","seven","eight","nine"];
    var i;
    for(i = 0; i < args.length - 1; i++){
      message.react(emoji[0]);
    }
	},
};