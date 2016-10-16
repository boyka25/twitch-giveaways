const postman = document.createElement('div');
postman.id = 'twitch-giveaways-message-passing';
postman.style.display = 'none';

const ignoredSenders = ['twitchnotify', 'jtv'];

document.body.appendChild(postman);

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

	postman.setAttribute('data-message', JSON.stringify({
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
	}));
}

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

	console.log('emotified: ' + slices.join(''));

	return slices.join('');
}

function emoteSorter(a, b) {
	return a.start < b.start ? -1 : 1;
}