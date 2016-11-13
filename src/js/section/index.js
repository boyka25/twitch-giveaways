var m = require('mithril');
var icon = require('../component/icon');
var ucFirst = require('to-sentence-case');
var withKey = require('../lib/withkey');
var animate = require('../lib/animate');
var config = require('tga/data/config.json');

module.exports = {
	name: 'index',
	controller: Controller,
	view: view
};

function Controller() {
	var self = this;

	this.cleanEntries = function () {
		for (var i = 0, user; user = self.users[i], i < self.users.length; i++) {
			delete user.keyword;
			delete user.keywordEntries;
		}
		self.updateSelectedUsers();
	};

	var minBitsSeter = this.setter('rolling.minBits');
	this.setMinBits = function (val) {
		minBitsSeter(rangeValToStep(config.cheerSteps, val));
	};

	var subscribedTimeSetter = this.setter('rolling.subscribedTime');
	this.setSubscribedTime = function (val) {
		subscribedTimeSetter(rangeValToStep(config.subscribedTimeSteps, val));
	};

	this.cancelKeyword = function () {
		self.setter('rolling.keyword')('');
		self.cleanEntries();
	};

	this.resetEligible = function () {
		for (var i = 0, user; (user = self.users[i++]);) {
			user.eligible = true;
		}
	};

	// send page view
	ga('send', 'pageview', '/app');
}

function view(ctrl) {
	var i = 0;
	return [
		m('fieldset.sponsored-by', [
			m('legend', 'Sponsored by'),
			require('../component/sponsors').view(ctrl)
		]),
		m('.controls', [
			m('.block.groups', Object.keys(ctrl.rolling.groups).map(groupToToggle, ctrl)),
			m('ul.block.rolltypes', {config: animate('slideinleft', 50 * i++)}, ctrl.rolling.types.map(typeToTab, ctrl)),
			m('.block.options', [
				// roll type specific options block
				tabs[ctrl.rolling.type].view(ctrl),

				// min bits
				m('.option', {key: 'min-bits', config: animate('slideinleft', 50 * i++)}, [
					m('label[for=min-bits]', 'Min bits'),
					m('input[type=range]#min-bits', {
						min: 0,
						max: config.cheerSteps.length - 1,
						step: 1,
						oninput: m.withAttr('value', ctrl.setMinBits),
						value: config.cheerSteps.indexOf(ctrl.rolling.minBits)
					}),
					m('span.meta', ctrl.rolling.minBits.toLocaleString())
				]),

				// subscribed time
				m('.option', {key: 'subscribed-time', config: animate('slideinleft', 50 * i++)}, [
					m('label[for=subscribed-time]', 'Subscribed time'),
					m('input[type=range]#subscribed-time', {
						min: 0,
						max: ctrl.config.subscribedTimeSteps.length - 1,
						oninput: m.withAttr('value', ctrl.setSubscribedTime),
						value: ctrl.config.subscribedTimeSteps.indexOf(ctrl.rolling.subscribedTime)
					}),
					m('span.meta', [ctrl.rolling.subscribedTime, ' ', icon('moon')])
				]),

				// subscriber luck
				m('.option', {
					key: 'subscriber-luck',
					config: animate('slideinleft', 50 * i++),
					className: ctrl.rolling.subscribedTime > 0 ? 'disabled' : ''
				}, [
					m('label[for=subscriber-luck]', 'Subscriber luck'),
					m('input[type=range]#subscriber-luck', {
						min: 1,
						max: ctrl.config.maxSubscriberLuck,
						oninput: m.withAttr('value', ctrl.setter('rolling.subscriberLuck').type('number')),
						value: ctrl.rolling.subscriberLuck,
						disabled: ctrl.rolling.subscribedTime > 0
					}),
					m('span.meta', ctrl.rolling.subscriberLuck, ' ', m('em', '×')),
					m('p.description', [
						'Subscribers ',
						ctrl.rolling.subscriberLuck > 1
							? ['are ', m('strong', ctrl.rolling.subscriberLuck), ' times more likely to win']
							: ['get no special treatment'],
						'. Details in ',
						m('a[href="#"]', {onmousedown: ctrl.toSection('config')}, 'FAQ'),
						'.'
					])
				]),

				// uncheck winners
				m('.option', {key: 'uncheck-winners', config: animate('slideinleft', 50 * i++)}, [
					m('label', {onmousedown: withKey(1, ctrl.setter('options.uncheckWinners').to(!ctrl.options.uncheckWinners))}, 'Uncheck winner'),
					icon(ctrl.options.uncheckWinners ? 'check' : 'close', {
						class: 'checkbox' + (ctrl.options.uncheckWinners ? ' checked' : ''),
						onmousedown: withKey(1, ctrl.setter('options.uncheckWinners').to(!ctrl.options.uncheckWinners))
					}),
					m('p.description.sameline', '… from the list to not win twice.')
				]),

				// announce winner
				m('.option', {key: 'announce-winner', config: animate('slideinleft', 50 * i++)}, [
					m('label', {onmousedown: withKey(1, ctrl.setter('options.announceWinner').to(!ctrl.options.announceWinner))}, 'Announce winner'),
					icon(ctrl.options.announceWinner ? 'check' : 'close', {
						class: 'checkbox' + (ctrl.options.announceWinner ? ' checked' : ''),
						onmousedown: withKey(1, ctrl.setter('options.announceWinner').to(!ctrl.options.announceWinner))
					}),
					m('p.description.sameline', [
						'Change template in ',
						m('a[href="#"]', {onmousedown: ctrl.toSection('config')}, 'Settings'),
						'.'
					])
				])

			]),
			m('.block.actions', [
				m('.btn.btn-info.reset', {
					config: animate('slideinleft', 50 * i++),
					onmousedown: withKey(1, ctrl.resetEligible),
					'data-tip': 'Reset eligible status<br><small>Checks all unchecked people.</small>'
				}, [m('i.eligible-icon')]),
				m('.btn.btn-success.roll', {
					config: animate('slideinleft', 50 * i++),
					onmousedown: withKey(1, ctrl.roll)
				}, 'Roll'),
			]),
		])
	];
}

function rangeValToStep(steps, val) {
	return steps[Math.min(Math.max(0, val|0), steps.length - 1)];
}

function groupToToggle(name, i) {
	return m('.btn', {
			class: this.rolling.groups[name] ? 'checked' : '',
			onmousedown: withKey(1, this.setter('rolling.groups.' + name).to(!this.rolling.groups[name])),
			config: animate('slideinleft', 50 * i)
		}, [
			icon(this.rolling.groups[name] ? 'check' : 'close'),
			ucFirst(name)
	]);
}

function typeToTab(name) {
	return m('li', {
		class: this.rolling.type === name ? 'active' : '',
		onclick: this.setter('rolling.type').to(name),
		'data-tip': tabs[name].tip(this)
	}, ucFirst(name));
}

var tabs = {};

tabs.active = {
	name: 'active',
	tip: function (ctrl) {
		return 'Roll from all active people'
			+ '<br>'
			+ '<small>'
			+ 'People that posted something in a last ' + ctrl.options.activeTimeout + ' minutes.'
			+ '</small>';
	},
	view: function () {
		return null;
	}
};

tabs.keyword = {
	name: 'keyword',
	tip: function () {
		return 'Keyword to enter<br><small>Only people who write the keyword will get in the list.</small>';
	},
	view: function (ctrl) {
		return [
			m('.option.keyword' + (ctrl.rolling.keyword ? '.active' : ''), {key: 'keyword', config: animate('slideinleft', 0)}, [
				m('input[type=text].word', {
					value: ctrl.rolling.keyword,
					placeholder: 'Enter keyword ...',
					oninput: m.withAttr('value', ctrl.setter('rolling.keyword')),
					onkeydown: withKey(27, ctrl.cancelKeyword)
				}),
				m('.btn.clean', {
					onmousedown: withKey(1, ctrl.cleanEntries),
					'data-tip': 'Clean all entries<br><small>Makes people enter the keyword again.</small>'
				}, [icon('trash')]),
				m('.btn.cancel', {
					onmousedown: withKey(1, ctrl.cancelKeyword),
					'data-tip': 'Cancel keyword <kbd>ESC</kbd>'
				}, [icon('close')])
			]),
			m('.option.case-sensitive', {key: 'case-sensitive', config: animate('slideinleft', 100)}, [
				m('label', {
					onmousedown: withKey(1, ctrl.setter('rolling.caseSensitive').to(!ctrl.rolling.caseSensitive))
				}, 'Case sensitive'),
				icon(ctrl.rolling.caseSensitive ? 'check' : 'close', {
					class: 'checkbox' + (ctrl.rolling.caseSensitive ? ' checked' : ''),
					onmousedown: withKey(1, ctrl.setter('rolling.caseSensitive').to(!ctrl.rolling.caseSensitive))
				}),
				m('p.description.sameline', [
					'Casing ',
					ctrl.rolling.caseSensitive
						? m('strong', 'matters!')
						: m('strong', 'doesn\'t matter!')
				])
			]),
		];
	}
};