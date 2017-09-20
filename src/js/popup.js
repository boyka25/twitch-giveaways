var q = document.querySelector.bind(document);
var defaults = {
	quickAccessChannels: ''
};
var channelsContainer = q('#channels');
var firstLoad = true;

loadChannels();
chrome.storage.onChanged.addListener(loadChannels);
document.addEventListener('DOMContentLoaded', loadChannels);
document.querySelector('#to-options').addEventListener('click', function (e) {
	e.preventDefault();
	chrome.runtime.openOptionsPage();
});

function loadChannels() {
	chrome.storage.sync.get(defaults, function(options) {
		var channels = serializeChannels(options.quickAccessChannels);
		if (firstLoad) {
			firstLoad = false;
			if (channels.length === 1) {
				chrome.tabs.create({
					url: chrome.extension.getURL('main.html?channel=' + channels[0])
				});
				return;
			}
		}
		channelsContainer.innerHTML = channels.map(function(channel) {
			var url = chrome.extension.getURL('main.html?channel=' + channel);
			return '<a href="' + url + '" target="_blank">' + channel + '</a>';
		}).join('');
		if (channels.length > 0) q('#help').remove();
	});
}

function serializeChannels(str) {
	return String(str || '')
		.split('\n')
		.map(function(line) {
			return line.trim().toLowerCase();
		})
		.filter(function(line) {
			return !!line;
		});
}