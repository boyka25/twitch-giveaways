var m = require('mithril');
var e = require('e');
var icon = require('../component/icon');

var config = require('tga/data/config.json');
var sponsors = require('tga/data/sponsors.json').filter(function (sponsor) {
	var time = Date.now();
	return time > new Date(sponsor.start) && time < new Date(sponsor.end);
});
sponsors.push({
	name: 'Sponsor TGA',
	message: 'Sponsor Twitch Giveaways!<br><a href="mailto:' + config.sponsorshipEmail + '" target="_blank"><strong>' + config.sponsorshipEmail + '</strong></a>',
});
var index = 0;
var activeSponsor = sponsors[index];
var prevSponsor;
var timeoutId;

resume();

function activate(i) {
	if (i < 0 || i >= sponsors.length) {
		throw new Error('Trying to activate out of bounds sponsor.');
	}
	index = i;
	prevSponsor = activeSponsor;
	activeSponsor = sponsors[index];
	m.redraw();
}

function next() {
	activate((index + 1) % sponsors.length);
}

function prev() {
	activate(index > 0 ? index - 1 : sponsors.length - 1);
}

function tick() {
	next();
	resume();
}

function pause() {
	clearTimeout(timeoutId);
}

function resume() {
	pause();
	if (sponsors.length > 1) {
		timeoutId = setTimeout(tick, config.sponsorsRotationTime);
	}
}

module.exports = function () {
	return m('.sponsors', {
		onmouseenter: pause,
		onmouseleave: resume
	}, [
		m('.banners', sponsors.map(function (sponsor) {
			return renderSponsor(sponsor, sponsor === activeSponsor ? 'active' : '');
		})),
		sponsors.length > 1 ? icon('chevron-left', 'arrow left', {onclick: prev}) : null,
		sponsors.length > 1 ? icon('chevron-right', 'arrow right', {onclick: next}) : null,
		sponsors.length > 1 ? m('.bullets', sponsors.map(function (_, i) {
			return m('.bullet', {
				class: i === index ? 'active' : '',
				onclick: activate.bind(null, i)
			})
		})) : null
	]);
};

function renderSponsor(sponsor, classes) {
	var content = sponsor.message
		? m('.message', m('.text', m.trust(sponsor.message)))
		: m('img', {src: chrome.extension.getURL('banner/' + sponsor.banner)});

	if (sponsor.url) {
		return m('a.banner', {
			key: sponsor.name,
			href: sponsor.url,
			target: '_blank',
			class: classes || ''
		}, [content]);
	} else {
		return m('.banner', {
			key: sponsor.name,
			class: classes || ''
		}, [content]);
	}

}