// 复制此段 JS 到 HTML 所有样式之前
(function(doc, win) {
    var docEl = doc.documentElement,
        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
        recalc = function() {
            var clientWidth = docEl.clientWidth;

            if (!clientWidth) {
                return;
            }
            if (clientWidth >= '<%= width %>') {
                docEl.style.fontSize = '<%= rem %>px';
            } else {
                docEl.style.fontSize = '<%= rem %>' * (clientWidth / '<%= width %>') + 'px';
            }
        };

    if (doc.addEventListener) {
        win.addEventListener(resizeEvt, recalc, false);
        doc.addEventListener('DOMContentLoaded', recalc, false);
    }
    recalc();
})(document, window);
