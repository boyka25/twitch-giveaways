var e = require('e');
var evt = require('event');
var Tip = require('tooltip');
var query = require('query');

// tga button
var icon = e.svg('svg', e.svg('use', {'xlink:href': '#icon-gift'}));
icon.setAttribute('class', 'icon Icon');
var button = module.exports = e('a.tga-button.button.button--icon-only.float-left', {
	href: 'javascript:void(0)'
}, icon);

// tooltip
var tip = new Tip('', {
	baseClass: 'tgatip',
	effectClass: 'slide',
	auto: 1
});
evt.bind(button, 'mouseenter', tip.show.bind(tip, button));
evt.bind(button, 'mouseleave', tip.hide.bind(tip));

button.tip = tip;

button.attach = function () {
	var container = query('.chat-buttons-container');
	if (container && button.parentNode !== container) container.appendChild(button);
	return button;
};