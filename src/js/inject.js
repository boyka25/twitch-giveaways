const postman = document.createElement('div');
postman.id = 'twitch-giveaways-message-passing';
postman.style.display = 'none';

const ignoredSenders = ['twitchnotify', 'jtv'];

document.body.appendChild(postman);

// Listen for messages from content script and handle the request
const requestHandlers = {
	'send-message': sendMessage
};
const observer = new MutationObserver(function (mutations) {
	for (const mutation of mutations) {
		if (mutation.attributeName === 'data-in') {
			const message = postman.getAttribute('data-in');
			try {
				const request = JSON.parse(message);
				const handler = requestHandlers[request.name];
				if (handler) {
					handler(request);
				}
			} catch (err) {
				console.log('Twitch Giveaways: Can\'t parse data-in message: ', err.message);
			}
		}
	}
});

observer.observe(postman, {attributes: true});

// Send message to content.js.
function sendToContent(request) {
	postman.setAttribute('data-out', JSON.stringify(request));
}

// Wait for TMI to load, than bind message listener to it.
window.addEventListener('load', function () {
	const start = Date.now();
	const interval = 50;
	const timeout = 5000;

	checkForTMI();

	function checkForTMI() {
		const sessions = TMI && TMI._sessions && TMI._sessions[0];
		const mainConnection = sessions && sessions._connections && sessions._connections.main;

		if (mainConnection) {
			mainConnection.on('message', processMessage);
			console.log('Twitch Giveaways: Listening on chat started.');
		} else if (start < Date.now() - timeout) {
			console.log('Twitch Giveaways: TMI interface not found after 5 seconds, giving up.');
		} else {
			setTimeout(checkForTMI, interval);
		}
	}
});

function processMessage(obj) {
	// Ignore notifications and other non-messages.
	if (obj.command !== 'PRIVMSG' || ~ignoredSenders.indexOf(obj.sender) || obj.style === 'notification') {
		return;
	}

	const tags = obj.tags;
	let bits = 0;
	const badges = tags._badges.map(obj => {
		if (obj.id === 'bits') {
			bits = obj.version;
		}
		return obj.id;
	});

	sendToContent({
		name: 'chat-message',
		data: {
			channel: obj.target.match(/#?(.+)/)[1],
			user: {
				name: obj.sender,
				displayName: tags['display-name'],
				badges: badges,
				staff: ~badges.indexOf('staff'),
				admin: ~badges.indexOf('admin'),
				broadcaster: ~badges.indexOf('broadcaster'),
				subscriber: tags.subscriber,
				mod: tags.mod,
				turbo: tags.turbo,
				bits: bits
			},
			text: obj.message,
			html: emotify(obj)
		}
	});
}

// Create message HTML string with emotes in it.
function emotify(obj) {
	const text = obj.message;
	const emotes = obj.tags.emotes;
	const slices = [];
	const serializeEmote = key => ({
		id: key,
		start: emotes[key][0][0],
		end: emotes[key][0][1]
	});

	let i = 0;
	for (const emote of Object.keys(emotes).map(serializeEmote).sort(emoteSorter)) {
		if (emote.start > 0) {
			slices.push(text.slice(0, emote.start));
		}

		let alt = text.slice(emote.start, emote.end + 1);
		slices.push(`<img
			class="emoticon"
			src="https://static-cdn.jtvnw.net/emoticons/v1/${emote.id}/1.0"
			alt="${alt}"
			title="${alt}"
		>`);
		i = emote.end + 1;
	}

	if (text.length > i) {
		slices.push(text.slice(i));
	}

	return slices.join('');
}

function emoteSorter(a, b) {
	return a.start < b.start ? -1 : 1;
}

// Send message to chat via Twitch UI.
function sendMessage(request) {
	const message = request.message;
	const chatTextarea = document.querySelector('.chat-room .js-chat_input');
	const chatSubmit = document.querySelector('.chat-room .js-chat-buttons__submit');

	if (!chatTextarea || !chatSubmit) {
		console.log('Twitch Giveaways: Message not sent. Can\' find the needed elements.');
		return;
	}

	chatTextarea.value = String(message);

	// Simulate an input event so ember's data binding picks up the new value,
	// since changing textarea.value programatically doesn't fire anything.
	chatTextarea.dispatchEvent(new Event('input', {
		bubbles: true,
		cancelable: true
	}));

	chatSubmit.click();
}

// Send message to chat via TMI interface.
// The disadvantage of this is that sender doesn't see the message he has send,
// so instead the sendMessage() function above is used.
function sendMessageTMI(data) {
	try {
		TMI._sessions[0]._connections.main._send(`PRIVMSG #${data.channel} :${data.message}`);
	} catch (err) {
		console.log('Twitch Giveaways: Couldn\'t send chat message, TMI interface not found.');
	}
}