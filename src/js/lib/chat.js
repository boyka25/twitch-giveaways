var emitter = require('emitter');
var query = require('query');
var slice = require('sliced');
var chatContainer = query('.chat-room .chat-lines');
var User = require('../model/user');
var textify = require('./textify');

if (!chatContainer) return;

var chat = module.exports = {};

// make chat object an event emitter
emitter(chat);

var chatTextarea = query('.chat-room .js-chat_input');
var chatSubmit = query('.chat-room .js-chat-buttons__submit');

// post message to the chat
chat.post = function (message) {
	if (!chatTextarea || !chatSubmit) return;

	chatTextarea.value = String(message);

	// Simulate an input event so ember's data binding picks up the new value,
	// since changing textarea.value programatically doesn't fire anything.
	chatTextarea.dispatchEvent(new Event('input', {
		bubbles: true,
		cancelable: true
	}));

	chatSubmit.click();
};

// chat messages observer
var chatObserver = new MutationObserver(function processMutations(mutations) {
	var addedNodes, i, l, node, line, message;
	for (var m = 0, ml = mutations.length; m < ml; m++) {
		addedNodes = mutations[m].addedNodes;
		for (i = 0, l = addedNodes.length; i < l; i++) {
			node = addedNodes[i];
			line = node.matches && node.matches('.chat-line')
				? node
				: node.querySelector && node.querySelector('.chat-line');
			message = parseLine(line);
			if (!message) continue;
			chat.emit('message', message);
		}
	}
});

// start observing mutations on chat messages
chatObserver.observe(chatContainer, { childList: true });

function parseLine(line) {
	if (!line) return;
	var message = {};

	// ignore deleted lines
	if (query('.deleted', line)) return;

	// get name
	var nameEl = query('.from', line);
	var name = nameEl && nameEl.textContent.trim();
	if (!name) return;

	// get html & text
	var html = query('.message', line).innerHTML.trim();
	var text = textify(html);

	return {
		user: {
			name: name,
			badges: slice(query.all('.badge', line)).map(getBadgeName).filter(truthy),
		},
		html: html,
		text: text,
		time: new Date()
	};
}

function getBadgeName(el) {
	return el.nodeName === 'DIV'
		? getBTTVBadgeName(el)
		: getTwitchBadgeName(el);
}

function getTwitchBadgeName(el) {
	var name = el.getAttribute('alt').toLowerCase();
	if (~User.badges.indexOf(name)) {
		return name;
	}
}

function getBTTVBadgeName(el) {
	for (var i = 0; i < User.badges.length; i++) {
		if (el.classList.contains(User.badges[i])) {
			return User.badges[i];
		}
	}
}

function truthy(group) {
	return group;
}