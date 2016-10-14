var channel = getChannelName();
var postman = document.createElement('div');
postman.id = 'twitch-giveaways-message-passing';
postman.style.display = 'none';

document.body.appendChild(postman);

var userBadges = ['broadcaster', 'staff', 'admin', 'moderator', 'user', 'subscriber'];
// chat messages observer
var chatObserver = new MutationObserver(processMutations);

// load observer when chat gets loaded
window.addEventListener('load', function () {
	var start = Date.now();
	var documentObserver = new MutationObserver(function () {
		var chatContainer = document.querySelector('.chat-room .chat-lines');
		if (chatContainer) {
			console.log('TGA: Chat container found, disconnecting document observer.');
			documentObserver.disconnect();
			startObserving(chatContainer);
			console.log('TGA: Observing chat started.');
		}
		if (start < Date.now() - 5000) {
			console.log('TGA: Chat not found after 5 seconds, disconnecting document observer.');
			documentObserver.disconnect();
		}
	});

	documentObserver.observe(document.body, { childList: true });
});

function getChannelName() {
	var match = window.location.pathname.match(/^\/([^\/]+)\/chat\/?$/);
	return match ? match[1].toLowerCase() : null;
}

function startObserving(chatContainer) {
	chatObserver.observe(chatContainer, { childList: true });
}

function processMutations(mutations) {
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
			postman.setAttribute('data-message', JSON.stringify(message));
		}
	}
}

function parseLine(line) {
	if (!line) return;
	var message = {};

	// ignore deleted lines
	if (line.querySelector('.deleted')) return;

	// get name
	var nameEl = line.querySelector('.from');
	var name = nameEl && nameEl.textContent.trim();
	if (!name) return;

	// get html & text
	var msgEl = line.querySelector('.message').cloneNode(true);
	var text = msgEl.textContent;
	Array.from(msgEl.querySelectorAll('.balloon')).forEach(function (el) {
		el.parentNode.removeChild(el);
	});
	var html = msgEl.innerHTML.trim();

	return {
		channel: channel,
		user: {
			name: name,
			badges: Array.from(line.querySelectorAll('.badge')).map(getBadgeName).filter(truthy),
		},
		html: html,
		text: text,
		time: new Date()
	};
}

function textify(html) {
	textify.root.innerHTML = html && html.nodeType === 1 ? html.outerHTML : html + '';
	var imgs = textify.root.querySelectorAll('img');
	for (var i = 0, l = imgs.length; i < l; i++) imgs[i].outerHTML = imgs[i].getAttribute('alt');
	return textify.root.textContent || textify.root.innerText;
}
textify.root = document.createElement('div');

function getBadgeName(el) {
	return el.nodeName === 'DIV'
		? getBTTVBadgeName(el)
		: getTwitchBadgeName(el);
}

function getTwitchBadgeName(el) {
	var name = el.getAttribute('alt').toLowerCase();
	if (~userBadges.indexOf(name)) {
		return name;
	}
}

function getBTTVBadgeName(el) {
	for (var i = 0; i < userBadges.length; i++) {
		if (el.classList.contains(userBadges[i])) {
			return userBadges[i];
		}
	}
}

function truthy(group) {
	return group;
}

function handleMessage(message) {
	postman.setAttribute('data-message', JSON.stringify(message));
}