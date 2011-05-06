(function (namespace,namespaceName) {

$(function(){

	var tool={},canvasOffsetX, canvasOffsetY, canvasPos = { x: 0, y: 0 }, toolName, start={ x:0, y:0} ,canvas={},oldPoints=[];

	var util=namespace.Util,
		gui=namespace.Gui,
		Sys=util.Sys,
		center=util.center,
		updatePos=gui.updatePos,
		MoveElem=gui.MoveElem,
		Module=gui.Module,
		Tool=gui.Tool,
		Range=gui.Range,
		Shape=gui.Shape,
		draw=gui.draw,
		updateImage=gui.updateImage,
		fillBrush=gui.fillBrush;

	namespace.Gui.setCanvasPos(canvasPos);
	namespace.Gui.setCanvas(canvas);
	namespace.Gui.setStart(start);
	
	var Config = {
		main:'c',
		temp:'c_temp',
		sync:'c_sync',
		brush:'c_brush',
		palette:'palette',
		container:'painter',
		color:'color',
		syncbrush:'syncbrush',
		client:'client'
	}
	
    var paint = new Module({
        title: "画板",
        contents: ['<canvas id="'+Config.main+'" width="700" height="575" style="position: absolute; z-index: 0; background: url(images/op_8x8.gif);cursor:crosshair;"></canvas>\
            <canvas id="'+Config.temp +'" width="700" height="575" style="position: absolute; z-index: 1;"></canvas>\
            <canvas id="'+Config.brush +'" width="1" height="1"></canvas>\
            <canvas id="'+Config.syncbrush +'" width="1" height="1"></canvas>\
            <canvas id="'+Config.sync +'" width="700" height="575" style="position: absolute; z-index: -1;"></canvas>'],
        width: 720,
        height: 620,
        container:'#'+Config.container
    });

    center(paint.M[0]);
    
    canvas.main = $("#"+Config.main);
    if (!canvas.main[0].getContext) {
        alert("您的浏览器不支持此应用");
        return;
    }
    
    var tools = new Module({
        title: "工具",
        container:'#'+Config.container,
        contents: ['<div><img src="images/pencil.png" onclick="Painter.tool.pencil.load();" style="width:40px;height:40px;"/>\
            <img src="images/brush.png" onclick="Painter.tool.brush.load();" style="width:40px;height:40px;"/>\
            <img src="images/eraser.png" onclick="Painter.tool.eraser.load();" style="width:40px;height:40px;"/>\
            <img src="images/picker.png" onclick="Painter.tool.picker.load();Painter.canvas.temp[0].style.cursor=\'url(images/picker.png),pointer\';" style="width:40px;height:40px;"/>\
            <span onclick="Painter.tool.beeline.load();canvas.temp[0].style.cursor=\'crosshair\';" >直线</span>\
            <img src="images/shape_ellipses.png" onclick="Painter.tool.rotundity.load();Painter.canvas.temp[0].style.cursor=\'crosshair\';" style="width:40px;height:40px;"/>\
            <img src="images/shape_polygon.png" onclick="Painter.tool.rectangle.load();Painter.canvas.temp[0].style.cursor=\'crosshair\';" style="width:40px;height:40px;"/></div>\
            <div id="'+Config.color+'" style="margin-top:10px;margin-left:5px;width: 34px; height: 23px; border: 1px solid #fff; float: left;"></div>\
            <div onclick="Painter.Gui.clearPaint();" style="margin-left:10px;cursor:pointer;font-weight:bold;line-height:40px;font-size:20px;float:left;">重画</div>\
            <div onclick="location.href=canvas.main[0].toDataURL();" style="margin-left:10px;cursor:pointer;font-weight:bold;line-height:40px;font-size:20px;float:left;">保存</div>']
    });
    tools.M.css({ left: Math.max(0, paint.M[0].offsetLeft - tools.M[0].offsetWidth - 10) + "px", top: paint.M[0].offsetTop + "px" });

    var m_option = new Module({
    	container:'#'+Config.container
    });
    m_option.M.css({ left: Math.max(0, paint.M[0].offsetLeft - m_option.M[0].offsetWidth - 10) + "px", top: paint.M[0].offsetTop + tools.M[0].offsetHeight + 10 + "px" });

    namespace.Gui.setMoption(m_option);
	
    var palette = new Module({
    	container:'#'+Config.container,
        title: "调色板",
        x: 500,
        y: 200,
        contents: [
            '<canvas id="'+	Config.palette +'" width="120" height="18"></canvas>'
        ],
        onload: function () {
            var $c_palette = $("#"+Config.palette);
            var w = $c_palette.width(), h = $c_palette.height();

            var ctx_palette = $c_palette[0].getContext("2d");
            var l = ctx_palette.createLinearGradient(0, 0, w, 0);
            l.addColorStop(0.125, '#FF0000');
            l.addColorStop(0.25, '#FFFF00');
            l.addColorStop(0.375, '#008080');
            l.addColorStop(0.5, 'blue');

            l.addColorStop(0.625, '#800080');
            l.addColorStop(0.75, '#2F4F4F');
            l.addColorStop(0.875, '#191970');
            l.addColorStop(1, '#000000');
            ctx_palette.fillStyle = l;
            ctx_palette.fillRect(0, 0, w, h);
            ctx_palette.stroke();

            $c_palette.mousedown(function (e) {
                    var x = (e.layerX - 10 || e.offsetX) - 1, y = (e.layerY || e.offsetY) - 1;
                    if (x < 0) x = 0;
                    else if (x >= w) x = w - 1;
                    if (y < 0) y = 0;
                    else if (y >= h) y = h - 1;

                    var data = ctx_palette.getImageData(x, y, 1, 1);
                    var r = data.data;
                    r[3] = r[3] / 255;
                    var rgba = "rgba(" + (Sys.firefox ? r.toString() : r[0] + "," + r[1] + "," + r[2] + "," + r[3]) + ")";

                    tool.fillStyle = rgba;
                    canvas.temp.ctx.fillStyle = rgba;
                    canvas.temp.ctx.strokeStyle = rgba;
                    fillBrush();
                    $("#"+Config.color).css("backgroundColor", rgba);
                });
        }
    });
    
    canvas.main = $("#"+Config.main);
    if (!canvas.main[0].getContext) {
        alert("您的浏览器不支持此应用");
        return;
    }
    canvas.temp = $("#"+Config.temp);
    canvas.brush = $("#"+Config.brush);
    canvas.sync = $("#"+Config.sync);
    canvas.syncbrush = $("#"+Config.syncbrush);
    
    canvas.main.ctx = canvas.main[0].getContext("2d");
    canvas.temp.ctx = canvas.temp[0].getContext("2d");
    canvas.brush.ctx = canvas.brush[0].getContext("2d");
    canvas.sync.ctx =canvas.sync[0].getContext("2d");
    canvas.syncbrush.ctx =canvas.syncbrush[0].getContext("2d");

    canvas.main.ctx.fillStyle = "#fff";
    canvas.main.ctx.fillRect(0, 0, canvas.temp.width(), canvas.temp.height());

    var tool = {
        fillStyle: "#000",
        pencil: new Tool({
            type: "pencil",
            diameter: 10,
            opacity: 80,
            draw: function (x, y) {
                draw(this.options.ctx, this.options.diameter, x + 7, y);
            	//draw(this.options.ctx, this.options.diameter, 0, 0);
            }
        }),
        brush: new Tool({
            type: "brush",
            diameter: 25,
            hardness: 60,
            flow: 92,
            opacity: 70,
            draw: function (x, y) {
            	  draw(this.options.ctx, this.options.diameter,  x, y);
            }
        }),
        eraser: new Tool({
            type: "eraser",
            ctx: canvas.main.ctx,
            diameter: 25,
            hardness: 60,
            flow: 90,
            opacity: 30,
            draw: function (x, y) {
                var c = this.options.ctx;
                c.globalCompositeOperation = 'destination-out';
                draw(c, this.options.diameter, x + 7, y + 10);
                c.globalCompositeOperation = 'source-over';
            }
        }),
        picker: new Shape({
            type: "picker",
            down: function (e) {
                var x = (e.layerX - 10 || e.offsetX) - 1, y = (e.layerY || e.offsetY) - 1;
                if (x < 0) x = 0;
                else if (x >= canvas.main.width()) x = canvas.main.width() - 1;
                if (y < 0) y = 0;
                else if (y >= canvas.main.height()) y = canvas.main.height() - 1;

                var data = canvas.main.ctx.getImageData(x + 15, y + 35, 1, 1);
                var r = data.data;
                r[3] = r[3] / 255;
                var rgba = "rgba(" + (Sys.firefox ? r.toString() : r[0] + "," + r[1] + "," + r[2] + "," + r[3]) + ")";

                tool.fillStyle = rgba;
                canvas.temp.ctx.fillStyle = rgba;
                canvas.temp.ctx.strokeStyle = rgba;
                fillBrush();
                $("#color").css("backgroundColor", rgba);
            }
        }),
        beeline: new Shape({
            type: "beeline",
            move: function (e) {
                var ctx = canvas.temp.ctx;
                ctx.clearRect(0, 0, canvas.temp.width(), canvas.temp.height());   //清除画布
                ctx.beginPath();
                ctx.moveTo(start.x - 10, start.y - 35);                         //移动画笔至当前鼠标坐标
                ctx.lineTo(canvasPos.x - 10, canvasPos.y - 35);               //绘制线条至当前鼠标坐标
                ctx.stroke();
            }
        }), 
        rectangle: new Shape({
            type: "rectangle",
            move: function (e) {
                var ctx = canvas.temp.ctx;
                ctx.clearRect(0, 0, canvas.temp.width(), canvas.temp.height());
                ctx.strokeRect(start.x - 10, start.y - 35, canvasPos.x - start.x, canvasPos.y - start.y);
            }
        }),
        rotundity: new Shape({
            type: "rotundity",
            move: function (e) {
                var ctx = canvas.temp.ctx;
                ctx.clearRect(0, 0, canvas.temp.width(), canvas.temp.height());
                ctx.beginPath();
                ctx.arc(start.x - 10, start.y - 35, Math.abs(canvasPos.x - start.x), 0, Math.PI * 2, true);
                ctx.stroke();
            }
        })
    }
	//配置外部属性
    namespace.Gui.setTool(tool);

    tool.pencil.load();
    
    var left=Math.max(0, paint.M[0].offsetLeft - palette.M[0].offsetWidth - 10) + "px",
        top=paint.M[0].offsetTop + m_option.M[0].offsetHeight + tools.M[0].offsetHeight + 94 + "px" ;
    
    palette.M.css({ left: left, top: top});
    

    var clientRect = canvas.temp[0].getBoundingClientRect();

    canvasOffsetX = clientRect.left, canvasOffsetY = clientRect.top;

    canvas.temp.mousedown(function (e) {
        canvas.temp.down = 1;                      
        start.x = canvasPos.x, start.y = canvasPos.y; 
        var params=getCurrentToolParams();
        oldPoints=[params.pos];
        tool.current.down(e);
        e.preventDefault();
    });

    
    document.getElementById(Config.container).onmousemove = function (e) {
        updatePos(e);   
        if (canvas.temp.down) {
        	var params=getCurrentToolParams(),cat=tool.current.category;
        	if(cat!='shape' && tool.current.type!='picker'){
        		oldPoints.push(params.pos);
        	}
            tool.current.move(e);
        }
    }
    document.getElementById(Config.container).onmouseup = function (e) {
        if (canvas.temp.down) {      	 
        	var params=getCurrentToolParams(),cat=tool.current.category;	
        	if(cat=='shape')
        		namespace.updateImageHandler(params.pos,params.options);     
        	else {
        		namespace.updateMouseMoveHandler(oldPoints.join('&'),params.options); 
                oldPoints=[];
        	}
        	updateImage();
            canvas.temp.down = 0;
        }
    };
    
    var getCurrentToolParams=function(){
    	var cat=tool.current.category,
			opts=tool.current.options;
	    
	    //获取当前绘制对象的参数
	    var pos=[],options=[];
		pos.push(start.x);
		pos.push(start.y);
		pos.push(canvasPos.x);
		pos.push(canvasPos.y);
		
		options.push(cat);   //类型
		options.push(tool.current.type);//子类
		options.push(tool.fillStyle);   //颜色
		options.push(opts.diameter); //直径
		options.push(opts.opacity);  //透明度
		
		if(cat!='shape'){ 
			options.push(opts.hardness);   //硬度
    		options.push(opts.flow);       //连续性		
		}
		
		return {
			pos:pos.join('_'),
			options:options.join('_')
		};
    }
    
    namespace.tool=tool;
    namespace.canvas=canvas;
    namespace.paint=paint;
    namespace.updateImageHandler=function(){};
    namespace.updateMouseMoveHandler=function(){};
});
    
})(Painter,'Painter');
