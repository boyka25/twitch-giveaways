var postman = document.createElement('div');
postman.id = 'twitch-giveaways-message-passing';
postman.style.display = 'none';

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

function processMessage(message) {
	// Ignore notifications and other non-messages.
	if (message.command !== 'PRIVMSG' || message.style === 'notification') {
		return;
	}

	const tags = message.tags;
	const bits = 0;
	const badges = tags._badges.map(obj => {
		if (obj.id === 'bits') {
			bits = obj.version;
		}
		return obj.id;
	});

	postman.setAttribute('data-message', JSON.stringify({
		channel: message.target.match(/#?(.+)/)[1],
		user: {
			name: message.sender,
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
		text: message.message,
		html: message.message
	}));
}
