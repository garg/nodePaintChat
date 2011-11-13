(function(namespace){
	
	var Sys = {};
    var ua = navigator.userAgent.toLowerCase();
    var s;
    (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] :
    (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
    (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
    (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
    (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;
	
	namespace.Util = {
		Class:function (p) {
		    var c = function () {
		        return (arguments[0] !== null && this.initialize && typeof (this.initialize) == "function") ?
		            this.initialize.apply(this, arguments) : this;
		    }; c.prototype = p; return c;
		},
		extend:function(d, s) { for (var p in s) { d[p] = s[p]; } return d; },
		apply:function(t, fn) { return function () { fn.apply(t, arguments); }; },
		getClientRect:function(elem) {
		    var pos = { left: 0, top: 0 };
		    var offsetParent = elem.offsetParent;
		    while (offsetParent != document.body) {
		        pos.left += offsetParent.offsetLeft;
		        pos.top += offsetParent.offsetTop;
		        offsetParent = offsetParent.offsetParent;
		    }
		    return pos;
		},
		center:function(elem) {
		    var scrollY = Sys.ie ? document.documentElement.scrollTop : pageYOffset;
		    var left = document.documentElement.clientWidth - elem.offsetWidth < 0 ? 0 : (document.documentElement.clientWidth - elem.offsetWidth) / 2;
		    var top = document.documentElement.clientHeight - elem.offsetHeight < 0 ? 0 : (document.documentElement.clientHeight - elem.offsetHeight) / 2 + scrollY;

		    elem.style.left = left + "px";
		    elem.style.top = top + "px";
		},
		Sys:Sys,
		log:function(str){
			if(window.console)
				window.console.log(str);
		},
		timeProcessArray:function(items,process,callback){
			var todo=items;
			setTimeout(function(){
				var start=+new Date();
				do {
					process(todo.shift());
				} while (todo.length>0 && (+new Date() -start <50));
				
				if(todo.length>0) {
					setTimeout(arguments.callee,25);
				} else {
					callback(items);
				}
			},25);
		}
	};
})(Painter);


