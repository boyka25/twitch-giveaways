var m = require('mithril');
var icon = require('../component/icon');
var animate = require('../lib/animate');
var withKey = require('../lib/withkey');

module.exports = {
	name: 'config',
	controller: Controller,
	view: view
};

function formatIngoreListItem(item) {
	return String(item).trim().replace(' ', '').toLowerCase();
}

function Controller() {
	var self = this;
	this.updateIgnoreList = function (list) {
		self.setter('options.ignoreList')(list.split('\n').map(formatIngoreListItem));
	};
}

function view(ctrl) {
	var i = 0;
	return [
		// active timeout
		m('article.option.active-timeout', {config: animate('slideinleft', 50 * i++)}, [
			m('label[for=option-active-timeout]', 'Active timeout'),
			m('input[type=range]#option-active-timeout', {
				min: 0,
				max: 60,
				oninput: m.withAttr('value', ctrl.setter('options.activeTimeout').type('number')),
				value: ctrl.options.activeTimeout
			}),
			m('span.meta', ctrl.options.activeTimeout
				? [ctrl.options.activeTimeout, ' ', m('em', 'min')]
				: [m('em', 'disabled')]
			),
			m('p.description', 'Time since last message, after which users are no longer considered active and removed from the list. Set to 0 to disable.')
		]),
		// uncheck winners
		m('article.option.uncheck-winners', {config: animate('slideinleft', 50 * i++)}, [
			m('label', {onmousedown: withKey(1, ctrl.setter('options.uncheckWinners').to(!ctrl.options.uncheckWinners))}, 'Uncheck winners'),
			icon(ctrl.options.uncheckWinners ? 'check' : 'close', {
				class: 'checkbox' + (ctrl.options.uncheckWinners ? ' checked' : ''),
				onmousedown: withKey(1, ctrl.setter('options.uncheckWinners').to(!ctrl.options.uncheckWinners))
			}),
			m('p.description', 'When enabled, winners are automatically unchecked to not win twice.')
		]),
		// keyword antispam
		m('article.option.keyword-antispam', {config: animate('slideinleft', 50 * i++)}, [
			m('label', {onmousedown: withKey(1, ctrl.setter('options.keywordAntispam').to(!ctrl.options.keywordAntispam))}, 'Keyword antispam'),
			icon(ctrl.options.keywordAntispam ? 'check' : 'close', {
				class: 'checkbox' + (ctrl.options.keywordAntispam ? ' checked' : ''),
				onmousedown: withKey(1, ctrl.setter('options.keywordAntispam').to(!ctrl.options.keywordAntispam))
			}),
			ctrl.options.keywordAntispam ? m('input[type=range]', {
				min: 1,
				max: 5,
				oninput: m.withAttr('value', ctrl.setter('options.keywordAntispamLimit').type('number')),
				value: ctrl.options.keywordAntispamLimit
			}) : null,
			ctrl.options.keywordAntispam ? m('span.meta', ctrl.options.keywordAntispamLimit) : null,
			m('p.description', 'People who enter keyword more than ' + howManyTimes(ctrl.options.keywordAntispamLimit) + ' are automatically unchecked.')
		]),
		// ignore list
		m('article.option.ignore-list', {config: animate('slideinleft', 50 * i++)}, [
			m('label[for=option-ignore-list]', [
				'Ignore list',
				m('p.description', 'Separate usernames with new lines.')
			]),
			m('textarea#option-ignore-list', {
				placeholder: 'enter names here',
				oninput: m.withAttr('value', ctrl.updateIgnoreList),
				value: ctrl.options.ignoreList.join('\n')
			})
		]),
		// display tooltips
		m('article.option.display-tooltips', {config: animate('slideinleft', 50 * i++)}, [
			m('label', {onmousedown: withKey(1, ctrl.setter('options.displayTooltips').to(!ctrl.options.displayTooltips))}, 'Display tooltips'),
			icon(ctrl.options.displayTooltips ? 'check' : 'close', {
				class: 'checkbox' + (ctrl.options.displayTooltips ? ' checked' : ''),
				onmousedown: withKey(1, ctrl.setter('options.displayTooltips').to(!ctrl.options.displayTooltips))
			}),
			m('p.description', 'Hide tooltips if you already know what is what.')
		])
	];
}

function howManyTimes(number) {
	number = number | 0;
	switch (number) {
		case 1: return 'once';
		case 2: return 'twice';
		default: return number + ' times';
	}
}