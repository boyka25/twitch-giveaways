var m = require('mithril');
var e = require('e');
var Tooltip = require('tooltip');
var animate = require('../lib/animate');

var cfg = {
	email: 'sponsorship@darsa.in'
};
var sponsors = require('tga/data/sponsors.json').filter(expired);

module.exports = {
	name: 'sponsors',
	view: view,
	cfg: cfg
};

function view(ctrl) {
	var s = sponsors;

	return m('.sponsors', [
		s[0] ? sponsor(s[0]) : placeholder(),
		s[1] ? sponsor(s[1]) : placeholder()
	]);
}

function sponsor(sponsor) {
	return m('a', {href: sponsor.url, config: tooltip(sponsor)}, [
		m('img.banner', {
			src: chrome.extension.getURL('banner/' + sponsor.banner)
		})
	]);
}

function placeholder() {
	var dummySponsor = {
		name: 'Your name',
		description: 'And description, leading to your custom URL...'
	};
	var linkProps = {
		href: 'mailto:' + cfg.email,
		target: '_blank',
		config: tooltip(dummySponsor)
	};

	return m('a', linkProps, [
		m('.sponsor-placeholder', [
			m('.text', [
				'Sponsor ',
				m('strong', 'Twitch Giveaways'),
				' and get your logo ',
				m('strong', 'HERE')
			])
		])
	]);
}

function expired(sponsor) {
	return new Date(sponsor.expires) > Date.now();
}

function tooltip(sponsor) {
	return function (el, isInit, ctx) {
		if (isInit) return;

		var content = e([
			e('strong', sponsor.name),
			e('br'),
			e('small', sponsor.description)
		]);
		var options = {
			baseClass: 'tgatip',
			auto: 1,
			effectClass: 'slide'
		};

		ctx.tip = new Tooltip(content, options);
		ctx.show = () => ctx.tip.show(el);
		ctx.hide = () => ctx.tip.hide();
		ctx.onunload = function () {
			el.removeEventListener('mouseover', ctx.show);
			el.removeEventListener('mouseout', ctx.hide);
		};

		el.addEventListener('mouseover', ctx.show);
		el.addEventListener('mouseout', ctx.hide);
	}
}