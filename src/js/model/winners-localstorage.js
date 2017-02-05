function uid(size = 10) {
	return Array(size)
		.fill(0)
		.map(() => Math.floor(Math.random() * 36).toString(36))
		.join('');
}

function Winners(channel) {
	this.channel = channel;
	this.dbkey = 'twitch-giveaways-past-winners';
	this.list = null;     // list of all past winners
	this.searchTerm = '';
	this.selection = [];
	this.channels = {};  // channelName->recordsCount map
	this.size = 0;       // character length of a serialized list, i.e. DB size
	this.keepAtLeast = 1000; // when clearing, keep at least this ammount of records per channel

	this.switchChannel = this.switchChannel.bind(this);
	this.search = this.search.bind(this);
	this.from = this.from.bind(this);
	this.to = this.to.bind(this);
	this.delete = this.delete.bind(this);
	this.mockAdd = this.mockAdd.bind(this);
}

Winners.prototype.connect = function () {
	var self = this;
	return new Promise(function (resolve, reject) {
		var list;
		try {
			list = localStorage[self.dbkey]
				? JSON.parse(localStorage[self.dbkey])
				: [];
			self.size = localStorage[self.dbkey] ? localStorage[self.dbkey].length : 0;
		} catch (err) {
			list = [];
		}
		self.list = list.map(function (record) {
			record.time = new Date(record.time);
			return record;
		});
		self.reselect();
		resolve();
	});
};

Winners.prototype.save = function () {
	if (!this.list) throw new Error('Can\'t save, store not connected.');
	var serialized = JSON.stringify(this.list);
	localStorage[this.dbkey] = serialized;
	self.size = serialized.length;
};

Winners.prototype.add = function (data) {
	if (!this.list) throw new Error('Can\'t add a winner, store not connected.');
	this.list.push({
		id: uid(),
		channel: this.channel,
		name: data.name,
		displayName: data.displayName,
		time: new Date(),
		title: data.title
	});
	this.save();
	this.reselect();
};

Winners.prototype.mockAdd = function (size) {
	size = Number(size) || 10;
	if (!this.list) throw new Error('Can\'t add a winner, store not connected.');
	var name;
	for (var i = 0; i < size; i++) {
		name = uid();
		this.list.push({
			id: uid(),
			name: name,
			displayName: name[0].toUpperCase() + name.slice(1),
			time: new Date(),
			title: Array(Math.round(Math.random()*20 + 2)).fill(0)
				.map(function() {
					return uid(Math.round(Math.random()*8 + 2));
				})
				.join(' ')
		});
	}
	this.save();
	this.reselect();
};

winners.prototype.switchChannel = function (channel) {
	this.channel = channel;
	this.reselect();
};

Winners.prototype.search = function (term) {
	this.searchTerm = String(term);
	this.reselect();
};

Winners.prototype.from = function (time) {
	this.fromTime = time ? new Date(time) : null;
	this.reselect();
};

Winners.prototype.to = function (time) {
	this.toTime = time ? new Date(time) : null;
	this.reselect();
};

Winners.prototype.delete = function (id) {
	this.list = this.list.filter(function (record) {return record.id !== id});
	this.save();
	this.reselect();
};

Winners.prototype.clearAll = function () {
	this.list = [];
	this.save();
	this.reselect();
};

Winners.prototype.clearChannel = function (channel) {
	this.list = this.list.filter(function (record) {
		return record.channel !== channel;
	});
	this.save();
	this.reselect();
};

Winners.prototype.reselect = function () {
	var self = this;
	var term = self.searchTerm.toLowerCase();
	Object.keys(this.channels).forEach(function (key) {
		this.channels[key] = 0;
	});
	this.selection = this.list.filter(function (record) {
		this.channels[record.channel] = channels[record.channel] ? channels[record.channel] + 1 : 0;
		if (self.channel && record.channel !== self.channel) return false;
		if (term
			&& record.name.indexOf(term) === -1
			&& record.title && record.title.toLowerCase().indexOf(term) === -1
		) return false;
		if (self.fromTime && record.time < self.fromTime) return false;
		if (self.toTime && record.time > self.toTime) return false;
		return true;
	});
};

module.exports = Winners;