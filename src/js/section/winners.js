var m = require('mithril');
var icon = require('../component/icon');
var withKey = require('../lib/withkey');
var escapeRegexp = require('escape-regexp');
var virtualList = require('../component/virtual-list');
var releaseNames = ['new', 'added', 'removed', 'changed', 'fixed'];

module.exports = {
	name: 'winners',
	controller: Controller,
	view: view
};

function Controller() {
	this.virtualList = virtualList();
	// send page view
	ga('send', 'pageview', '/app/winners');
}

function view(ctrl) {
	var formatTime = makeFormatTime();
	function mockAdd() {
		if (ctrl.winners.searchTerm.indexOf('mock') !== 0) return;
		var count = Number(ctrl.winners.searchTerm.slice(4)) || 10;
		ctrl.winners.search('');
		ctrl.winners.mockAdd(count);
	}

	function deleteRecord(id) {
		return function () {
			ctrl.winners.delete(id).then(m.redraw);
		};
	}

	function clearSelected() {
		var confirmed = window.confirm('Delete all ' + ctrl.winners.selected.length + ' currently selected records?');
		if (confirmed) ctrl.winners.clearSelected();
	}

	var channels = Object.keys(ctrl.winners.channels);
	if (channels.indexOf(ctrl.winners.channel) === -1) channels.push(ctrl.winners.channel);
	channels = channels.sort();

	var search = ctrl.winners.searchTerm
		? new RegExp('(' + escapeRegexp(ctrl.winners.searchTerm) + ')', 'i')
		: false;

	return [
		m('.controls', [
			m('input[type=search]', {
				placeholder: 'search...',
				value: ctrl.winners.searchTerm,
				oninput: m.withAttr('value', ctrl.winners.search),
				onkeydown: withKey(27, ctrl.winners.search.bind(null, '')),
				onkeyup: withKey(13, mockAdd)
			}),
			m('select.channel', {onchange: m.withAttr('value', ctrl.winners.switchChannel)},
				channels.map(function (channel) {
					return m('option', {value: channel, selected: channel === ctrl.winners.selectedChannel}, channel);
				})
			),
			m('.time', [
				m('.from', [
					m('span', 'From:'),
					m('input[type=date]', {oninput: m.withAttr('value', ctrl.winners.from)})
				]),
				m('.to', [
					m('span', 'To:'),
					m('input[type=date]', {oninput: m.withAttr('value', ctrl.winners.to)})
				]),
			])
		]),
		ctrl.virtualList(
			{class: 'winners', itemSize: 50, itemsCount: ctrl.winners.selected.length},
			function (i) {
				var record = ctrl.winners.selected[ctrl.winners.selected.length - i - 1];
				return m('.record', {key: record.id}, [
					m('.name', search
						? m.trust(record.displayName.replace(search, '<span class="query">$1</span>'))
						: record.displayName),
					m('.time', formatTime(record.time)),
					m('.title', search
						? m.trust(record.title.replace(search, '<span class="query">$1</span>'))
						: record.title),
					m('button.delete', {onclick: deleteRecord(record.id)}, [icon('trash')])
				]);
			}
		),
		m('.stats', [
			m('.stat', {'data-tip': 'Number of selected records'}, [
				m('span.title', 'selected'),
				m('span.value', ctrl.winners.selected.length)
			]),
			m('.stat', {'data-tip': 'Number of records in this channel'}, [
				m('span.title', 'channel'),
				m('span.value', ctrl.winners.currentChannel().length)
			]),
			m('.stat', {'data-tip': 'Number of records in all channels'}, [
				m('span.title', 'total'),
				m('span.value', countAllRecords(ctrl.winners))
			]),
			m('.stat', {'data-tip': 'Data used'}, [
				m('span.title', 'of ' + formatSize(chrome.storage.local.QUOTA_BYTES)),
				m('span.value', formatSize(ctrl.winners.used))
			]),
			m('.spacer'),
			m('button.action', {
				onclick: clearSelected,
				'data-tip': 'Clear selected records'
			}, [icon('trash'), 'selected']),
		])
	];
}

function countAllRecords(winners) {
	return Object.keys(winners.channels).reduce(function (count, key) {
		count += winners.channels[key].length;
		return count;
	}, 0);
}

const sizeUnits = ['B', 'KB', 'MB', 'GB', 'TB'];
function formatSize(size) {
	let i = 0;
	while (size >= 1000) {
		size /= 1024;
		i++;
	}
	return `${size % 1 ? size.toFixed(1) : size} ${sizeUnits[i]}`;
}

function makeFormatTime() {
	var second = 1000;
	var minute = second * 60;
	var hour = minute * 60;
	var day = hour * 24;
	var week = day * 7;
	var now = Date.now();
	var minuteAgo = now - minute;
	var hourAgo = now - hour;
	var dayAgo = now - day;
	var weekAgo = now - week;
	var currentYear = new Date().getFullYear();

	return function (time) {
		if (time > minuteAgo) return Math.floor((now - time) / second) + ' seconds ago';
		if (time > hourAgo) return Math.floor((now - time) / minute) + ' minutes ago';
		if (time > dayAgo) return Math.floor((now - time) / hour) + ' hours ago';
		if (time > weekAgo) return Math.floor((now - time) / day) + ' days ago';
		var date = new Date(time);
		if (date.getFullYear() === currentYear) {
			return date.toLocaleString(navigator.language, {month: 'short'})
				+ ' ' + date.toLocaleString(navigator.language, {day: '2-digit'});
		}
		return date.toLocaleDateString();

	}
}