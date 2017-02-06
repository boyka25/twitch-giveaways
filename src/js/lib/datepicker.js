var Pikaday = require('../vendor/pikaday');

var defaults = {
	minDate: new Date('01-01-2017'),
	maxDate: new Date()
};

module.exports = function makeDatePicker(options) {
	options = Object.assign({}, defaults, options);
	return function (el, isInit, ctx) {
		if (isInit) return;

		console.log(options);

		var picker = new Pikaday({
			field: el,
			minDate: options.minDate,
			maxDate: options.maxDate,
			position: 'bottom right',
			onSelect: mockInputEvent
		});

		window.picker = picker;

		ctx.onunload = function () {
			console.log('destroying picker');
			picker.destroy();
		};

		function mockInputEvent() {
			var event = new Event('input', {bubbles: true, cancelable: true});
			Object.defineProperty(event, 'keyCode', {value: 13});
			Object.defineProperty(event, 'which', {value: 13});
			el.dispatchEvent(event);
		}
	};
};