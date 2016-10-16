var m = require('mithril');
var icon = require('../component/icon');
var Tooltips = require('tooltips');
var throttle = require('throttle');
var withKey = require('../lib/withkey');
var Components = require('../lib/components');
var Messages = require('../component/messages');
var Section = require('../lib/section');
var setters = require('../lib/setters');
var twitch = require('../lib/twitch');
var chat = require('../lib/chat');
var evt = require('event');
var extend = require('extend');

var app = module.exports = {};
app.controller = Controller;
app.view = view;
app.config = require('tga/data/config.json');
app.options = require('tga/data/options.json');

/**
 * Initiate an app on a container, and return the controller instance.
 *
 * @param  {Element} container
 * @return {Controller}
 */
app.init = function (container) {
	var instance = new Controller(container);
	m.module(container, {
		controller: function () {
			return instance;
		},
		view: view
	});
	return instance;
};

// models
var User = require('../model/user');
var Users = require('../model/users');
var Message = require('../model/message');

function Controller(container, config) {
	var self = this;
	this.app = this;
	this.container = container;
	this.setter = setters(this);

	// session data
	this.config = extend(true, app.config, config);
	var savedOptions = localStorage[this.config.storageName]
		? JSON.parse(localStorage[this.config.storageName])
		: {};
	this.options = extend(true, {}, app.options, savedOptions);
	this.version = require('tga/data/changelog.json')[0].version;
	this.isNewVersion = this.options.lastReadChangelog !== this.version;
	this.users = new Users();
	this.selectedUsers = new Users();
	this.rolling = {
		type: 'active',
		types: ['active', 'keyword'],
		subscriberLuck: 1,
		groups: {
			staff: true,
			admin: true,
			mod: true,
			user: true
		}
	};
	this.winner = null;
	this.messages = new Messages();

	// save config on change
	this.setter.on('options', function (options) {
		localStorage[self.config.storageName] = JSON.stringify(options);
	});

	// selected users abstraction
	this.updateSelectedUsers = function () {
		self.selectedUsers.reset();
		for (var i = 0, user; user = self.users[i], i < self.users.length; i++)
			if (selectedFilter(user)) self.selectedUsers.insert(user);
	};

	var requestUpdateSelectedUsers = throttle(function () {
		self.updateSelectedUsers();
		setTimeout(m.redraw);
	}, 100);

	function selectedFilter(user) {
		if (!self.rolling.groups[user.group]) return false;
		if (self.rolling.subscriberLuck > self.config.maxSubscriberLuck && !user.subscriber) return false;
		if (self.searchFilter && user[self.searchFilter.prop] !== self.searchFilter.value) return false;
		if (self.searchQuery && !~user.id.indexOf(self.searchQuery)) return false;
		if (self.rolling.type === 'keyword' && self.keyword && self.keyword !== user.keyword) return false;
		return true;
	}

	chat.on('message', function (message) {
		var id = twitch.toID(message.user.name);
		var user;
		if (self.users.exists(id)) {
			user = self.users.get(id);
			var prevGroup = user.group;
			user.extend(message.user);
			// if user's group has changed, we need to resort users
			if (prevGroup !== user.group) {
				self.users.sort();
				self.updateSelectedUsers();
			}
		} else {
			user = new User(message.user);
			// check if the user shouldn't be ignored
			if (~Users.ignoredGroups.indexOf(user.group)) return;
			if (~self.options.ignoreList.indexOf(user.id)) return;
			self.users.insert(user);
		}
		user.lastMessage = new Date();
		if (self.winner === user) user.messages.push(new Message(message));
		if (self.keyword && message.text.indexOf(self.keyword) === 0) {
			if (self.options.keywordAntispam && user.keyword === self.keyword) {
				user.keywordEntries++;
				if (user.keywordEntries > self.options.keywordAntispamLimit) user.eligible = false;
			} else {
				user.keyword = self.keyword;
				user.keywordEntries = 1;
				self.selectedUsers.insert(user);
			}
		}
		if (self.winner && self.winner === user && !self.winner.respondedAt)
			self.winner.respondedAt = new Date();
		m.redraw();
	});

	this.users.on('insert', function (user) {
		if (selectedFilter(user)) self.selectedUsers.insert(user);
	});
	this.users.on('remove', self.selectedUsers.remove.bind(self.selectedUsers));

	this.setter.on('rolling.type', this.updateSelectedUsers);
	this.setter.on('rolling.groups', this.updateSelectedUsers);

	// search
	this.search = '';
	this.searchFilter = null;
	this.searchQuery = '';
	this.setter.on('search', function () {
		self.search = String(self.search).trim().toLowerCase();
		self.searchFilter = self.config.searchFilters[self.search[0]];
		self.searchQuery = self.searchFilter ? self.search.substr(1).trim() : self.search;
	});
	this.setter.on('search', requestUpdateSelectedUsers);

	// keyword
	this.keyword = '';
	this.setter.on('keyword', requestUpdateSelectedUsers);

	// rolling function
	this.roll = function () {
		self.messages.clear();

		var pool = [];
		var subLuck = self.rolling.subscriberLuck;
		for (var i = 0, j, user; user = self.selectedUsers[i], i < self.selectedUsers.length; i++) {
			if (!user.eligible) continue;
			if (user.subscriber && subLuck > 1)
				for (j = 0; j < subLuck; j++) pool.push(user);
			else pool.push(user);
		}

		if (!pool.length) {
			self.messages.danger('There is none to roll from.');
			return;
		}

		// clean current winner data
		if (self.winner) {
			delete self.winner.rolledAt;
			delete self.winner.respondedAt;
			delete self.winner.messages;
		}

		// prick random winner from array of eligible users
		var winner = pool[Math.random() * pool.length | 0];
		winner.messages = [];
		winner.rolledAt = new Date();

		// uncheck winner
		if (self.options.uncheckWinners) {
			winner.eligible = false;
		}

		// announce winner
		if (self.options.announceWinner) {
			chat.post(String(self.options.announceTemplate).replace('{name}', winner.name));
		}

		// set winner and open their profile
		self.setter('winner')(winner);
		self.section.activate('profile', winner);
	};

	// components
	this.components = new Components(this)
		.use(require('../component/userlist'), this.selectedUsers);

	// primary section
	this.section = new Section(this)
		.use(require('../section/index'))
		.use(require('../section/config'))
		.use(require('../section/changelog'))
		.use(require('../section/about'))

		.use(require('../section/profile'))
		.use(require('../section/bitcoin'));

	// clear messages when changing sections
	this.section.on('active', this.messages.clear.bind(this.messages));

	// this.toSection = this.section.activator.bind(this.section);
	this.toSection = function (name, data) {
		return withKey(1, self.section.activator(name, data));
	};

	// active section class - returns 'active' when passed section name is active
	this.classWhenActive = function (name, normalClass, activeClass) {
		if (!activeClass) {
			activeClass = normalClass;
			normalClass = '';
		}
		return normalClass + ' ' + (self.section.isActive(name) ? activeClass || 'active' : '');
	};

	// tooltips
	this.tooltips = false;
	this.setter.on('options.displayTooltips', makeTooltips);
	makeTooltips(this.options.displayTooltips);

	function makeTooltips(display) {
		if (display && !self.tooltips) self.tooltips = new Tooltips(container, self.config.tooltips);
		else if (!display && self.tooltips) {
			self.tooltips.destroy();
			self.tooltips = false;
		}
	}

	// set user cleaning interval
	this.cleanUsers = function () {
		var timeout = self.options.activeTimeout
			? new Date(+new Date() - self.options.activeTimeout * 1000 * 60)
			: false;
		var removed = 0;
		for (var i = 0, user; user = self.users[i], i < self.users.length; i++) {
			var timedOut = timeout && user.lastMessage < timeout;
			if (timedOut || ~self.options.ignoreList.indexOf(user.id)) {
				self.users.remove(user);
				i--; removed++;
			}
		}
		if (removed) m.redraw();
	};
	this.userCleanIntervalID = setInterval(this.cleanUsers, 1000 * 10);

	// also clean users when ignore list has changed
	this.setter.on('options.ignoreList', throttle(this.cleanUsers, 1000));
}

function view(ctrl) {
	return [
		m('.viewers', [
			m('.bar', [
				m('.search', [
					m('input[type=text]', {
						oninput: m.withAttr('value', ctrl.setter('search')),
						onkeydown: withKey(27, ctrl.setter('search').to('')),
						placeholder: 'Search...',
						required: true,
						value: ctrl.search
					}),
					ctrl.search
						? m('.cancel', {onclick: ctrl.setter('search').to(''), 'data-tip': 'Cancel search <kbd>ESC</kbd>'}, icon('close', '-small'))
						: null
				]),
				m('h3.count', ctrl.selectedUsers.length)
			]),
			ctrl.components.render('userlist'),
		]),
		m('.primary', [
			m('.bar', {key: 'bar'}, [
				m('div', {
					class: ctrl.classWhenActive('index', 'button index', 'active'),
					onmousedown: ctrl.toSection('index'),
					'data-tip': 'Giveaway'
				}, [icon('gift')]),
				ctrl.winner
					? m('div', {
						class: ctrl.classWhenActive('profile', 'button profile', 'active'),
						onmousedown: ctrl.toSection('profile', ctrl.winner),
						'data-tip': 'Last winner'
					}, [icon('trophy'), m('span.label', ctrl.winner.name)])
					: null
				,
				m('.spacer'),
				m('div', {
					class: ctrl.classWhenActive('config', 'button config', 'active'),
					onmousedown: ctrl.toSection('config'),
					'data-tip': 'Settings'
				}, [icon('cogwheel')]),
				m('div', {
					class: ctrl.classWhenActive('changelog', 'button index', 'active'),
					onmousedown: ctrl.toSection('changelog'),
					'data-tip': 'Changelog'
				}, [
					icon('list'),
					ctrl.isNewVersion && !ctrl.section.isActive('changelog') ? m('.new') : null
				]),
				m('div', {
					class: ctrl.classWhenActive('about', 'button index', 'active'),
					onmousedown: ctrl.toSection('about'),
					'data-tip': 'About + FAQ'
				}, [icon('help')]),
				m('.button.close', {
					onmousedown: ctrl.close, 'data-tip': 'Close Giveaways'
				}, [icon('close')])
			]),
			ctrl.messages.render(),
			m('section.section.' + ctrl.section.active, {key: 'section-' + ctrl.section.active}, ctrl.section.render()),
		])
	];
}