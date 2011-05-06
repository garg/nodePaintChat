(function(namespace){
		
	var extend=namespace.Util.extend,
		apply=namespace.Util.apply,
		getClientRect=namespace.Util.getClientRect,
		center=namespace.Util.center,
		Class=namespace.Util.Class,
		Sys=Painter.Util.Sys;

	
	//outside params         
	var tool={},canvasPos={},canvas,start={},m_option={};
	
	function createFlow(cb , oX ,oY ,flow) {
	    var flow = Math.max(1,100 - flow);
	    function run(a, b, n) {
	        var i = n / flow;
	        if (n > 0) {
	            for (; i > 0; i--) {
	                cb(a * i, b * i);
	            }
	        } else {
	            for (; i < 0; i++) {
	                cb(a * i, b * i);
	            }
	        }
	    };
	    if (Math.abs(oX) > Math.abs(oY)) {
	        run(flow, flow * (oY / oX), oX);
	    } else {
	        run(flow * (oX / oY), flow, oY);
	    }
	};
	
	function updateBrush() {
	    var ctx = canvas.brush.ctx,
	        t = tool.current,
	        d = t.options.diameter,
	        o = t.options.opacity,
	        h = t.options.hardness || 100;
	        d2 = d * 2;
	
	    canvas.brush[0].width = canvas.brush[0].height = d2;
	
	    var sr = h / 100 * d;
	    sr >= 1 && sr--;
	
	    var r = ctx.createRadialGradient(d, d, sr, d, d, d);
	    r.addColorStop(0, 'rgba(0,0,0,' + o / 100 + ')');
	    r.addColorStop(0.95, 'rgba(0,0,0,0)');
	    r.addColorStop(1, 'rgba(0,0,0,0)');
	    ctx.fillStyle = r;
	    ctx.fillRect(0, 0, d2, d2);
	    fillBrush();
	}
	
	function fillBrush() {
	    var ctx = canvas.brush.ctx,
	        t = tool.current,
	        d = t.options.diameter,
	        d2 = d * 2;
	    ctx.globalCompositeOperation = 'source-in';
	    ctx.rect(0, 0, d2, d2);
	    ctx.fillStyle = tool.fillStyle;
	    ctx.fill();
	    ctx.globalCompositeOperation = 'source-over';
	}
	
	function getScroll() {
	    var o = {};
	    if (Sys.chrome) {
	        o.left = document.body.scrollLeft;
	        o.top = document.body.scrollTop;
	    } else {
	        o.left = document.documentElement.scrollLeft;
	        o.top = document.documentElement.scrollTop;
	    }
	    return o;
	}

	function updatePos(e) {
	    var o = getScroll();
	    var o1 = getClientRect(canvas.main[0]);
	    canvasPos.x = e.clientX - o1.left + o.left;
	    canvasPos.y = e.clientY - o1.top + o.top;
	}

	function updateImage() {
	    canvas.main.ctx.drawImage(canvas.temp[0], 0, 0);
	    canvas.temp.ctx.clearRect(0, 0, canvas.temp[0].width, canvas.temp[0].height);
	}
	
	function clearPaint() {
	    var temp = canvas.main.ctx.fillStyle;
	    canvas.main.ctx.fillStyle = "#fff";
	    canvas.main.ctx.fillRect(0, 0, canvas.main.width(), canvas.main.height());
	    canvas.main.ctx.fillStyle = temp;
	}

	function draw(ctx,d,x,y){
	    ctx.drawImage(canvas.brush[0], canvasPos.x - d - x, canvasPos.y - d - y);
	}
	
	var cn = {
		    pencil:"铅笔",
		    brush:"画笔",
		    eraser:"橡皮擦",
		    beeline:"直线",
		    rectangle:"矩形",
		    rotundity:"圆形",
		    diameter:"直径",
		    hardness:"硬度",
		    flow:"连续性",
		    opacity:"透明度"
		};
	
	var gui_options = {
	    pencil:{ 
	        build:["diameter", "opacity"],
	        diameter:15,
	        opacity:100
	    },
	    brush:{ 
	        build:["diameter", "hardness", "flow", "opacity"],
	        diameter:100,
	        hardness:100,
	        flow:100,
	        opacity:100
	    },
	    eraser:{ 
	        build:["diameter", "hardness", "flow", "opacity"],
	        diameter:100,
	        hardness:100,
	        flow:100,
	        opacity:100
	    },
	    beeline:{ 
	        build:["diameter", "opacity"],
	        diameter:100,
	        opacity:100
	    },
	    rectangle:{ 
	        build:["diameter", "opacity"],
	        diameter:100,
	        opacity:100
	    },
	    rotundity:{ 
	        build:["diameter", "opacity"],
	        diameter:100,
	        opacity:100
	    }
	}
	
	// 让元素自由移动
	var MoveElem = new Class({
	    initialize: function (options) {
	        if (!this.setOptions(options)) return null;
	
	        this._move = apply(this, this.move);
	        this._mouseup = apply(this, this.mouseup);
	        this.Main.css("position", "absolute");
	        this.DragElem.bind("mousedown", apply(this, this.mousedown));
	    },
	    setOptions: function (options) {
	        if (!options.id && !options.$elem[0]) return 0;
	
	        this.options = {
	            id: "",
	            dragElemId: "",
	            $elem: null,
	            $dragElem: null
	        };
	        extend(this.options, options || {});
	
	        this.Main = this.options.$elem || $("#" + this.options.id);
	        this.DragElem = this.options.$dragElem ? this.options.$dragElem :
	            this.options.dragElemId ? $("#" + this.options.dragElemId) : this.Main;
	        return 1;
	    },
	    mousedown: function (event) {
	        var e = window.event || event;
	        this._offsetX = e.layerX || e.offsetX || 0;
	        this._offsetY = e.layerY || e.offsetY || 0;
	
	        $(document).bind("mousemove", this._move).bind("mouseup", this._mouseup);
	        Sys.ie ? this.Main[0].setCapture() : e.preventDefault();
	    },
	    move: function (event) {
	        var o = getScroll();
	        var e = window.event || event, x = e.clientX - this._offsetX + o.left, y = e.clientY - this._offsetY + o.top;
	        this.Main.css({ left: x + "px", top: y + "px" });
	    },
	    mouseup: function (event) {
	        $(document).unbind("mousemove", this._move).unbind("mouseup", this._mouseup);
	        if (Sys.ie) this.Main[0].releaseCapture();
	    }
	});
	
	var Module = new Class({
	    initialize: function (options) {
	        this.setOptions(options);
	        this.create();
	    },
	    setOptions: function (options) {
	        this.options = {
	            x: 0,
	            y: 0,
	            width: 215,
	            height: 0,
	            title: "新建模块",
	            contents: [],
	            onload: function () { },
	            canclose:false
	        };

	        extend(this.options, options || {});
	    },
	    create: function () {
	        this.M = $('<div class="module" style="display:none;"></div>');
	        this.Title = $('<div></div>');
	        if(this.options.canclose)
	          this.CloseBtn = $('<span>X</span>').bind("mousedown", apply(this, this.close));
	        else
	        	this.CloseBtn = '';
	        this.Main = $('<div></div>');
	
	        this.setX(this.options.x);
	        this.setY(this.options.y);
	        this.setWidth(this.options.width);
	        this.setHeight(this.options.height);
	        this.setTitle(this.options.title);
	
	        this.appendContent(this.options.contents);
	        this.M.append(this.Title.append(this.CloseBtn)).append(this.Main).appendTo(this.options.container).show();
	        new MoveElem({ $elem: this.M, $dragElem: this.Title });
	        this.run(this.options.onload);
	    },
	    run: function (fn) {
	        fn.apply(this);
	    },
	    setX: function (val) {
	        this.M.css("left", val + "px");
	    },
	    setY: function (val) {
	        this.M.css("top", val + "px");
	    },
	    setWidth: function (val) {
	        this.M.width(val);
	    },
	    setHeight: function (val) {
	        if (val) {
	            this.M.height(val);
	            this.Main.height(val - 45);
	        }
	    },
	    setTitle: function (val) {
	        this.Title.text(val);
	    },
	    appendContent: function (elems) {
	        for (var i = 0; i < elems.length; i++) {
	            this.Main.append(elems[i]);
	        }
	    },
	    close: function () {
	        this.M.remove();
	    }
	});
	
	var Range = new Class({
	    initialize: function (options) {
	        this.setOptions(options);
	        this.create();
	    },
	    setOptions: function (options) {
	        this.options = {
	            width: 120,     //记录滑动条宽度
	            blockWidth: 13, //记录滑动块宽度
	            minVal: 1,
	            maxVal: 100,
	            initVal: 1,
	            valShowElemId: "",
	            onchange: function () { },
	            onmouseup: function () { }
	        };
	        extend(this.options, options || {});
	    },
	    create: function () {
	        this.Range = $('<div class="rangeBar"></div>');
	        //获取滑动块元素
	        this.RangeBlock = $('<div></div>');
	        this.Range.append(this.RangeBlock);
	        //设置间隔值
	        this.setInterval(this.options.minVal, this.options.maxVal);
	        //记录上一次滑动条值
	        this.preVal = this.curVal = this.options.initVal;
	        //设置滑动块初始值
	        this.setCurrentVal(this.options.initVal);
	    },
	    bindEvent: function () {
	        this._move = apply(this, this.move);
	        this._mouseup = apply(this, this.mouseup);
	        //给滑动条绑定 mousedown 事件
	        this.Range.bind("mousedown", apply(this, this.mousedown));
	        //给滑动块绑定 mousedown 事件
	        this.RangeBlock.bind("mousedown", apply(this, this.mousedown));
	
	        if (this.options.valShowElemId) {
	            this.ValShowElem = $("#" + this.options.valShowElemId);
	            this.ValShowElem.text(this.curVal);
	        }
	    },
	    mousedown: function (event) {
	        var e = window.event || event, target = e.target || e.srcElement;
	
	        if (target == this.Range[0]) {
	            this._offsetX = 7;
	            this.moveTo(e, this.Range[0]);
	        } else if (target == this.RangeBlock[0]) {
	            //记录鼠标相对于移动元素的x轴偏移值
	            this._offsetX = e.layerX || e.offsetX;
	        }
	
	        //给 document 绑定 mousemove、mouseup 事件
	        $(document).bind("mousemove", this._move).bind("mouseup", this._mouseup);
	        Sys.ie ? this.RangeBlock[0].setCapture() : e.preventDefault();
	        e.stopPropagation();
	    },
	    move: function (event) {
	        this.moveTo(window.event || event, this.RangeBlock[0]);
	    },
	    moveTo: function (e, elem) {
	 
	        var pos = getClientRect(elem);
	        var x = e.clientX - this._offsetX - pos.left - 10;
	
	        if (x < 0) x = 0;
	        else if (x > this.options.width - this.options.blockWidth) x = this.options.width - this.options.blockWidth;
	
	        this.RangeBlock.css({ left: x + "px" });
	
	        var val = Math.round(x / this.Interval) + this.options.minVal;
	        if (val != this.preVal) {
	            this.preVal = this.curVal;
	            this.curVal = val;
	
	            if (this.ValShowElem) this.ValShowElem.text(val);
	            this.options.onchange.apply(this);
	        }
	    },
	    mouseup: function (event) {

	        $(document).unbind("mousemove", this._move).unbind("mouseup", this._mouseup);
	        Sys.ie && this.RangeBlock[0].releaseCapture();
	        this.options.onmouseup.apply(this);
	    },
	    setInterval: function (minVal, maxVal) {
	        this.Interval = (this.options.width - this.options.blockWidth) / (maxVal - minVal);
	    },
	    setCurrentVal: function (val) {
	        this.RangeBlock.css("left", (val - this.options.minVal) * this.Interval + "px");
	    }
	});
	
	var Tool = new Class({
	    initialize: function (options) {
	        this.setOptions(options);
	    },
	    setOptions: function (options) {
	        this.options = {
	            type: "",
	            ctx: canvas.main.ctx,
	            diameter: 1,
	            hardness: 100,
	            flow: 100,
	            opacity: 100,
	            draw: function () { }
	        };
	        extend(this.options, options || {});
	        this.type=this.options.type;
	        this.category='tool';
	    },
	    load: function () {
	        tool.current = this;
	        updateBrush();
	        m_option.M.show();
	        new Options();
	        canvas.temp[0].style.cursor='url(images/'+this.options.type+'.png),pointer';
	    },
	    set: function (opt, val) {
	        var min = 1,
	            max = gui_options[this.options.type][opt];
	        if (val >= min && val <= max) {
	            this.options[opt] = val;
	            updateBrush();
	        }
	    },
	    setdiameter: function (val) {
	        this.set("diameter", val);
	    },
	    sethardness: function (val) {
	        this.set("hardness", val);
	    },
	    setflow: function (val) {
	        this.set("flow", val);
	    },
	    setopacity: function (val) {
	        this.set("opacity", val);
	    },
	    down: function () {
	        this.draw(0, 0);
	    },
	    draw: function (x, y) {
	        this.options.draw.apply(this, arguments);
	    },
	    move: function () {
	    	var oX = canvasPos.x - start.x,
				oY = canvasPos.y - start.y;
	        createFlow(apply(this, this.draw),oX, oY, tool.current.options.flow);
	        start.x = canvasPos.x;
	        start.y = canvasPos.y;
	    }
	});
	
	var Shape = new Class({
	    initialize: function (options) {
	        this.setOptions(options);
	    },
	    setOptions: function (options) {
	        this.options = {
	            type: "",
	            ctx: canvas.temp.ctx,
	            diameter: 1,
	            opacity: 100,
	            move: function () { },
	            down: function () { }
	        };
	        extend(this.options, options || {});
	        this.type=this.options.type;
	        this.category='shape';
	    },
	    load: function () {
	        tool.current = this;
	        this.options.ctx.lineWidth = this.options.diameter;
	        this.options.ctx.globalAlpha = this.options.opacity / 100;
	        if (this.options.type != "picker") {
	            new Options();
	            m_option.M.show();
	        }
	        else m_option.M.hide();
	    },
	    set: function (opt, val, cb) {
	        var min = 1,
	            max = gui_options[this.options.type][opt];
	        if (val >= min && val <= max) {
	            this.options[opt] = val;
	            cb.apply(this, [val]);
	        }
	    },
	    setdiameter: function (val) {
	        this.set("diameter", val, function (v) {
	            this.options.ctx.lineWidth = v;
	        });
	    },
	    setopacity: function (val) {
	        this.set("opacity", val, function (v) {
	            this.options.ctx.globalAlpha = v / 100;
	        });
	    },
	    down: function (e) {
	        this.options.down.apply(this, arguments);
	    },
	    move: function () {
	        this.options.move.apply(this);
	    }
	});
	
	var Options = new Class({
	    initialize: function () {
	        var t = tool.current,
	            options = gui_options[t.options.type].build;
	
	        m_option.setTitle(cn[t.options.type]);
	        m_option.Main.html("");
	        for (var index in options) {
	            (function () {
	                var opt = options[index],
	                arg = gui_options[t.options.type];
	
	                var range = new Range({
	                    maxVal: arg[opt],
	                    initVal: t.options[opt],
	                    valShowElemId: t.options.type + "_" + opt,
	                    onmouseup: function () {
	                        t["set" + opt](this.curVal);
	                    }
	                });
	                m_option.appendContent([
	                    '<div>' + cn[opt] + '</div>',
	                    $('<div style="margin:2px 0;overflow:hidden;"></div>').append(range.Range).append('<span id="' + range.options.valShowElemId + '" style="margin-left:20px;color:#fff;"></span>')
	                ]);
	                range.bindEvent();
	            })(index);
	        }
	    }
	});
	
	//exports gui components
	namespace.Gui={
	  MoveElem:MoveElem,
	  Module:Module,
	  Tool:Tool,
	  Range:Range,
	  Shape:Shape,
	  Options:Options,
	  updatePos:updatePos,
	  draw:draw,
	  updateImage:updateImage,
	  clearPaint:clearPaint,
	  fillBrush:fillBrush,
	  createFlow:createFlow,
	  setTool:function(t){
		tool=t;
	  },
	  setCanvasPos:function(pos){
		canvasPos=pos;
	  },
	  setCanvas:function(c){
		 canvas=c;
	  },
	  setStart:function(s){
		start=s;
	  },
	  setMoption:function(opt){
		m_option=opt;
	  }
	};
	
})(Painter);