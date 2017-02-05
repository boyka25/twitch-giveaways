var m = require('mithril');

module.exports = VirtualList;

function VirtualList() {
	var container, scrollTop, scrollLeft, width, height;

	function config(el, isInit, ctx) {
		if (isInit) return;
		container = el;

		window.addEventListener('resize', update);
		container.addEventListener('scroll', update);

		ctx.onunload = function () {
			window.removeEventListener('resize', update);
			container.removeEventListener('scroll', update);
		};

		update();
	}

	function update() {
		scrollTop = container.scrollTop;
		scrollLeft = container.scrollLeft;
		width = container.clientWidth;
		height = container.clientHeight;
		m.redraw();
	}

	return function (props, render) {
		var v = !props.horizontal;
		var pos = v ? scrollTop : scrollLeft;
		var viewSize = v ? height : width;
		var startIndex = Math.floor(pos / props.itemSize);
		var endIndex = Math.min(startIndex + Math.ceil(viewSize / props.itemSize), props.itemsCount - 1);
		var startSpacing = `${startIndex * props.itemSize}px`;
		var endSpacing = `${(props.itemsCount - endIndex - 1) * props.itemSize}px`;
		var containerStyle = {
			overflowX: v ? 'hidden' : 'auto',
			overflowY: v ? 'auto' : 'hidden'
		};
		var startSpacerStyle = {
			width: v ? 0 : startSpacing,
			height: v ? startSpacing : 0
		};
		var endSpacerStyle = {
			width: v ? 0 : endSpacing,
			height: v ? endSpacing : 0
		};
		var items = [];

		items.push(m('.start-spacer', {key: 'start-spacer', style: startSpacerStyle}));
		for (let i = startIndex; i <= endIndex; i++) {
			items.push(render(i));
		}
		items.push(m('.end-spacer', {key: 'end-spacer', style: endSpacerStyle}));

		return m('div', {class: props.className || props.class, config: config}, items);
	};
}