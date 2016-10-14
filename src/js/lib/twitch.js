var m = require('mithril');
var ucfirst = require('to-sentence-case');
var twitch = require('./twitch');
var query = require('query');

var twitch = module.exports = {
	api: 'https://api.twitch.tv/kraken',
	clientID: 'h9v0ctx2gn0uchv227fq2q2daimfkol',
	timeout: 10000,
	request: function request(resource) {
		return m.request({
			method: 'GET',
			url: twitch.api + resource,
			background: true,
			config: function (xhr) {
				xhr.setRequestHeader('Client-ID', twitch.clientID);
				xhr.setRequestHeader('Accept', 'application/vnd.twitchtv.v3+json');
				setTimeout(xhr.abort.bind(xhr), twitch.timeout);
			}
		});
	},
	toID: function (value) {
		return String(value).trim().replace(' ', '').toLowerCase();
	},
	following: function (username, channel) {
		channel = twitch.toID(channel);
		username = twitch.toID(username);
		return twitch.request('/users/' + username + '/follows/channels/' + channel);
	},
	profile: function (username) {
		username = twitch.toID(username);
		return twitch.request('/users/' + username);
	},
	currentChannel: function () {
		var match = window.location.pathname.match(/^\/([^\/]+)\/chat\/?$/i);
		if (!match) return false;
		var ogTitle = query('head meta[property="og:title"]');
		return {
			id: match[1],
			name: ogTitle ? ogTitle.content : ucfirst(match[1]),
			hasFollower: function (username, callback) {
				twitch.following(username, match[1], callback);
			}
		};
	},
	pageType: function () {
		var path = window.location.pathname;
		if (path.match(/^\/([^\/]+)\/chat\/?$/i))
			return 'chat';
		if (query('.chat-room') && path.match(/^\/[^\/]+\/?$/i))
			return 'channel';
	}
};