var channel = getChannelName();
var button = document.createElement('a');
button.className = 'tga-button button button--icon-only float-left';
button.title = 'Open Twitch Giveaways';
button.target = '_blank';
button.innerHTML = '<svg width="20" height="20" viewBox="0 0 512 512" style="margin: 4px 4px 0"><g fill="#6441a4"><path d="M231 462h-162.875v-204.331h162.875v204.331zm0-301.331h-181v67h181v-67zm50 301.331h162.875v-204.331h-162.875v204.331zm0-301.331v67h181v-67h-181zm16.884-45h37.032c27.667 0 26.667-35.669 5.426-35.669-16.384 0-29.071 15.335-42.458 35.669zm51.458-65.669c63.574 0 62.908 90.669-.426 90.669h-91.166c12.673-27.625 38.166-90.669 91.592-90.669zm-174.184 30c-21.241 0-22.241 35.669 5.426 35.669h37.032c-13.387-20.334-26.074-35.669-42.458-35.669zm-9-30c53.426 0 78.919 63.044 91.592 90.669h-91.166c-63.334 0-64-90.669-.426-90.669z"/></g></svg>';

// check if we are running in an extension page
if (window.name === 'tga-embedded-chat') {
	// inject page context script
	inject();

	// process DOM manipulation requests
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.name === 'post-message') {
			postMessage(request.message);
		}
	});
} else {
	// Keep updating TGA button
	setInterval(function (callback) {
		var container = document.querySelector('.chat-buttons-container');
		if (!container) return;

		channel = getChannelName();
		if (!channel) return;

		button.href = chrome.extension.getURL('main.html?channel=' + channel);
		if (button.parentNode !== container) container.appendChild(button);
	}, 1000);
}

function getChannelName() {
	var match = window.location.pathname.match(/^\/([^\/]+)(\/|$)/);
	return match ? match[1].toLowerCase() : null;
}

function inject() {
	var script = document.createElement('script');
	Object.assign(script, {
		id: 'twitch-giveaways-inject-script',
		onload: loadObserver,
		src: chrome.extension.getURL('inject.js')
	});

	document.body.appendChild(script);
}

function loadObserver() {
	var postman = document.querySelector('#twitch-giveaways-message-passing');
	var observer = new MutationObserver(function processMutations() {
		var message = postman.getAttribute('data-message');
		try {
			var data = JSON.parse(message);
			chrome.runtime.sendMessage({name: 'chat-message', data: data});
		} catch(err) {
			console.log('Twitch Giveaways: Can\'t parse postman message: ', message);
		}
	});

	observer.observe(postman, {attributes: true});
}

// post message to the chat
function postMessage(message) {
	var chatTextarea = document.querySelector('.chat-room .js-chat_input');
	var chatSubmit = document.querySelector('.chat-room .js-chat-buttons__submit');

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
};