var emitter = require('emitter');
var channel = require('./channel');

var chat = module.exports = {};

// make chat object an event emitter
emitter(chat);

// listen for new chat-message events sent by content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (message.name === 'chat-message' && message.data.channel === channel.id) {
		chat.tab = sender.tab;
		chat.emit('message', message.data);
	}
});

// post message to the chat
chat.post = function (message) {
	if (!chat.tab) {
		console.log('TGA: Can\'t send the message, don\'t know where to :(');
		return;
	}

	// asks content script to post the message
	chrome.tabs.sendMessage(chat.tab.id, {
		name: 'post-message',
		message: message
	});
};

