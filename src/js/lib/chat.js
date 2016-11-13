var emitter = require('emitter');
var channel = require('./channel');

var chat = module.exports = {};

// Make chat object an event emitter.
emitter(chat);

// Listen for new chat-message events sent by content script.
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (message.name === 'chat-message' && message.data.channel === channel.name) {
		chat.tab = sender.tab;
		chat.emit('message', message.data);
	}
});

// Send message to chat.
chat.post = function (message) {
	if (!chat.tab) {
		console.log('Twitch Giveaways: Can\'t send the message, don\'t know where to :(');
		return;
	}

	// asks content script to post the message
	chrome.tabs.sendMessage(chat.tab.id, {
		name: 'send-message',
		channel: channel.name,
		message: message
	});
};

