var q = document.querySelector.bind(document);
var defaults = {
	quickAccessChannels: ''
};
var didSave = (function() {
	var savedElement = q('#saved');
	var opacity = 0;
	var speed = 0.01;
	var fid;

	savedElement.style.opacity = '0';

	return function() {
		opacity = 1;
		if (!fid) fid = requestAnimationFrame(fadeOut);
	};

	function fadeOut() {
		var old = opacity;
		opacity = Math.max(0, opacity - speed);
		if (old !== opacity) savedElement.style.opacity = String(opacity);
		if (opacity > 0) {
			fid = requestAnimationFrame(fadeOut);
		} else {
			fid = 0;
		}
	}
})();

document.addEventListener('DOMContentLoaded', restoreOptions);
q('body').addEventListener('input', debounce(saveOptions, 200));

function saveOptions() {
	var data = {
		quickAccessChannels: sanitizeChannels(q('#quick-access-channels').value)
	};
	chrome.storage.sync.set(data, didSave);
}

function restoreOptions() {
	chrome.storage.sync.get(defaults, function(options) {
		q('#quick-access-channels').value = options.quickAccessChannels;
	});
}

function sanitizeChannels(str) {
	return String(str || '')
		.split('\n')
		.map(function(line) {
			return line.trim().toLowerCase();
		})
		.filter(function(line) {
			return !!line;
		})
		.join('\n');
}

function debounce(func, wait) {
	var ctx, args, rtn, timeoutID;

	return function debounced() {
		ctx = this;
		args = arguments;
		if (timeoutID) clearTimeout(timeoutID);
		timeoutID = setTimeout(call, wait);
		return rtn;
	};

	function call() {
		timeoutID = 0;
		rtn = func.apply(ctx, args);
		ctx = null;
		args = null;
	}
}
