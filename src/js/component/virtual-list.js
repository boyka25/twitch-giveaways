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

		// page crashes without timeout here. no idea...
		setTimeout(update, 100);
	}

	function update() {
		scrollTop = container.scrollTop;
		scrollLeft = container.scrollLeft;
		width = container.clientWidth;
		height = container.clientHeight;
		m.redraw();
	}

	return function (props) {
		var v = !props.horizontal;
		var pos = v ? scrollTop : scrollLeft;
		var viewSize = v ? height : width;
		var startIndex = Math.floor(pos / props.itemSize);
		var endIndex = Math.min(startIndex + Math.ceil(viewSize / props.itemSize), props.itemsCount - 1);
		var startSpacing = (startIndex * props.itemSize) + 'px';
		var endSpacing = ((props.itemsCount - endIndex - 1) * props.itemSize) + 'px';
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

		if (props.itemsCount === 0) {
			if (props.renderEmpty) items.push(props.renderEmpty());
		} else {
			items.push(m('.start-spacer', {key: 'start-spacer', style: startSpacerStyle}));
			for (var i = startIndex; i <= endIndex; i++) {
				items.push(props.renderItem(i));
			}
			items.push(m('.end-spacer', {key: 'end-spacer', style: endSpacerStyle}));
		}

		return m('div', Object.assign({}, props.props, {style: containerStyle, config: config}), items);
	};
}