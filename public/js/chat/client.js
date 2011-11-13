$(function(){
	
	var log=Painter.Util.log,
	    extend=Painter.Util.extend,
	    util=Painter.Util,
		Module=Painter.Gui.Module,
		paint=Painter.paint,
		timeProcessArray=Painter.Util.timeProcessArray;
	
	//dependency
	var createFlow=Painter.Gui.createFlow;
	
	var transmission_errors = 0 ,first_poll =true;
	
	var CONFIG= Painter.CONFIG;
	
    var nick = 'hello_'+new Date().getTime();
    
    var updateBrush=function(diameter,opacity,hardness,fillStyle) {
	    var canvas=Painter.canvas,
	    	ctx = Painter.canvas.syncbrush.ctx,
	        d = diameter,
	        o = opacity,
	        h = hardness || 100;
	        d2 = d * 2;
	
	    canvas.syncbrush[0].width = canvas.syncbrush[0].height = d2;
	
	    var sr = h / 100 * d;
	    sr >= 1 && sr--;
	
	    var r = ctx.createRadialGradient(d, d, sr, d, d, d);
	    r.addColorStop(0, 'rgba(0,0,0,' + o / 100 + ')');
	    r.addColorStop(0.95, 'rgba(0,0,0,0)');
	    r.addColorStop(1, 'rgba(0,0,0,0)');
	    ctx.fillStyle = r;
	    ctx.fillRect(0, 0, d2, d2);
	    fillBrush(diameter,fillStyle);
	}
	
	var fillBrush=function(diameter,fillStyle) {
	    var canvas=Painter.canvas,
	    	ctx = Painter.canvas.syncbrush.ctx,
	        d = diameter,
	        d2 = d * 2;
	    ctx.globalCompositeOperation = 'source-in';
	    ctx.rect(0, 0, d2, d2);
	    ctx.fillStyle = fillStyle;
	    ctx.fill();
	    ctx.globalCompositeOperation = 'source-over';
	}
    
  
  var drawOper= function(pos,options,nick){ 	
	  
	  if(nick==CONFIG.nick){
		  return;
	  }
	
	  var options=options.split('_'),
	  	  cat=options[0];  
	  if(cat=='shape')  
		  drawShape(pos.split('_'),options); 
	  else{
		  var arr=pos.split('&');
		  var len=arr.length;
		  if(len==1){
			 var posOne=arr[0].split('_');
			 drawFlow(posOne,options,true);   		  
		  } else {
			  var drawWork=function(item){
				 var posOne=item.split('_');  
				 drawFlow(posOne,options);
			  }
			  //分时操作
			  timeProcessArray(arr ,drawWork,function(){});
		  }		  
	  }	
  }
  
  var drawFlow=function(pos, options , onlyone){
	  
	  var canvas=Painter.canvas,
	  	  tool=Painter.tool,
	  	  type=options[1],
	  	  startX=parseInt(pos[0]),
	  	  startY=parseInt(pos[1]),
	  	  endX=parseInt(pos[2]),
	  	  endY=parseInt(pos[3]),
	  	  flow=options[6],
	  	  fillStyle=options[2],
	  	  diameter=parseInt(options[3]),
	  	  opacity=parseInt(options[4]),
	  	  hardness=parseInt(options[5]),
	  	  ctx=canvas.main.ctx;

	  updateBrush(diameter,opacity,hardness,fillStyle);
	  
	  var draw = function (x, y) {
		  switch(type){
		  	case 'pencil':x=x+7;break;
		  	case 'eraser':x=x+7;y=y+10;break;
		  }
		  ctx.drawImage(canvas.syncbrush[0],endX - diameter - x, endY - diameter - y);
      }
	  
	  if(onlyone){
		  draw(0,0);
		  return;
	  }
	  
	  if(type=='eraser')
		  ctx.globalCompositeOperation = 'destination-out';
	  createFlow(draw, endX-startX, endY-startY, flow);
	  if(type=='eraser')
		  ctx.globalCompositeOperation = 'source-over';
  }
  
  var drawShape=function(pos, options){
	  var startX=parseInt(pos[0]),
	  	  startY=parseInt(pos[1]),
	  	  endX=parseInt(pos[2]),
	  	  endY=parseInt(pos[3]);
	  
	  var canvas=Painter.canvas,
	  	  syncCtx = canvas.sync.ctx,
	  	  type=options[1];
	  
  	  syncCtx.fillStyle = options[2];
      syncCtx.strokeStyle = options[2];  
      syncCtx.lineWidth = parseInt(options[3]);
      syncCtx.globalAlpha = parseInt(options[4]) /100;
  		
	  switch(type){
	  	case 'beeline':
	  		syncCtx.beginPath();
	  		syncCtx.moveTo(startX - 10, startY - 35);           //移动画笔至当前鼠标坐标
	  		syncCtx.lineTo(endX - 10, endY - 35);               //绘制线条至当前鼠标坐标
	  		syncCtx.stroke();
            break;
	  	case 'rectangle':
	  		syncCtx.clearRect(0, 0, canvas.sync.width(), canvas.sync.height());
	  		syncCtx.strokeRect(startX - 10, startY - 35, endX - startX, endY - startY);
            break;
	  	case 'rotundity':
	  		syncCtx.beginPath();
	  		syncCtx.arc(startX - 10, startY - 35, Math.abs(endX - startX), 0, Math.PI * 2, true);
	  		syncCtx.stroke();
            break;
	  }	  
	  canvas.main.ctx.drawImage(canvas.sync[0], 0, 0);
	  syncCtx.clearRect(0, 0, canvas.sync[0].width, canvas.sync[0].height);	  
  }
    
  //process updates if we have any, request updates from the server,
 // and call again with response. the last part is like recursion except the call
 // is being made from the response handler, and not at some point during the
 // function's execution.
 var subscribse=function(){
	//make another request
	 $.ajax({ 
	   cache: false, 
	   type: "GET", 
	   url: "/users/subscribse", 
	   dataType: "json", 
	   data: { since: CONFIG.last_message_time, id: CONFIG.id, msgid:CONFIG.msgid }, 
	   error: function () {
		   log("", "long poll error. trying again...", new Date(), "error");
           //don't flood the servers on error, wait 10 seconds before retrying
           setTimeout(longPoll, 10*1000);
       }, 
       success: function (json) {
    	   transmission_errors = 0;
    	   if(json.status==1) 
    		   longPoll(json.data);
       }
	 }); 
 }
 
 function longPoll (data) {
   if (transmission_errors > 2) {
     log('transmission_errors > 2');
     return;
   }

   if (data && data.rss) {
     var rss = data.rss,
         vsize = data.vsize,
         heapTotal=data.heapTotal,
         heapUsed=data.heapUsed;
     //paint.setTitle('画板'+' '+'内存使用情况：vsize:'+vsize+' heapTotal:'+heapTotal+' heapUsed:'+heapUsed);
     log('rss:'+rss);
   }

   //process any updates we may have
   //data will be null on the first call of longPoll
   if (data && data.messages) {
	   
	 var userChanged =false;
     
     var handlerMessage=function(message){
     	 
     	 if(!message) return;
         //track oldest message so we only request newer messages from server
         if (message.msgid > CONFIG.msgid)
           CONFIG.msgid = message.msgid;

         //dispatch new messages to their appropriate handlers
         switch (message.type) {
           case "msg":
             client.appendMsg(message.nick+'：',message.text);
             break;
           case "join":
          	client.appendInfo(message.nick+'加入了聊天室');
          	userChanged=true;
             break;
           case "part":
          	client.appendInfo(message.nick+'退出了聊天室');
          	userChanged=true;
             break;
           case "oper":
             //判断是否清空画板，临时方案
             if(message.subtype!='clear'){
          	   drawOper(message.pos,message.options,message.nick);        	   
             }
             else {   
          	   client.appendInfo(message.nick+'清空了画板');
          	   Painter.Gui.clearPaint();
             }
             break;
         }
     }
     
     timeProcessArray(data.messages ,handlerMessage, function(){ 
    	 if(userChanged)
    		 showUsers();	
    	 subscribse();
     });
   } 
   else {
	   subscribse();	   
   }
   
 }
 	
    var client = new Module({
    	container:'#painter',
        title: "聊天室",
        x: 300,
        y: 200,
        width:300,
        contents: 
        ['<div>\
         	<ul style="overflow:auto;height:300px;margin:0px 0px 20px 0px;"></ul>\
			<div>\
				<input type="text" style="width:200px;"></input>\
				<input type="button" value="发送"></input>\
			</div>\
		</div>'],
        onload: function () {
            var $client = $(this.M[0]),$inputEl=$client.find(':text'),self=this,$msgUl=$client.find('ul');
                    
            this.appendMsg=function(nickname,msg){
            	$msgUl.append('<li><span style="color:yellow;">'+nickname+'</span>'+msg+'</li>');
            	$msgUl.scrollTop(10000);
            };
            
            this.appendInfo=function(msg){
            	$msgUl.append('<li><span style="color:red;">'+msg+'</span></li>');
            	$msgUl.scrollTop(10000);
            };
            
            this.sendMsg=function(){
            	var val=jQuery.trim($inputEl.val());
            	if(val=='') {
            		return;
            	}
            	jQuery.post("/users/sendMsg", {id: CONFIG.id, text: val}, function (data) { $inputEl.val('');}, "json");
            }
            
            $client.find(':button').click(this.sendMsg);
            
            $client.find(':text').keypress(function(e){
            	if(e.keyCode==13)
            		self.sendMsg();
            });
            
        }
    });
    
    client.M.css({ left: paint.M[0].offsetLeft+paint.M[0].offsetWidth-client.M[0].offsetWidth -20, top:paint.M[0].offsetTop +50 });

 
//if we can, notify the server that we're going away.
 $(window).unload(function () {
   jQuery.get("/users/exit", {id: CONFIG.id}, function (data) { }, "json");
 });
 
 Painter.updateImageHandler=function(pos,options){
	 jQuery.post("/users/sendOper", {id: CONFIG.id, subtype:'mousemove' ,pos: pos, options:options}, function (data) { }, "json");
 }
 
 Painter.updateMouseMoveHandler=function(pos,options){
	 jQuery.post("/users/sendOper", {id: CONFIG.id, subtype:'mousedown' ,pos: pos, options:options}, function (data) { }, "json");
 }
 
 var showUsers=function(callback){
	  jQuery.get("/users/getAll", {id: CONFIG.id}, function (json) { 		  
		  var nicks=json.data.nicks ,users=[];
		  for(var i=0,len=nicks.length;i<len;i++){
			  users.push(nicks[i]);		 
		  }	
		  if(users.length>0)
			  client.appendInfo('当前用户：'+users.join(','));
		  
		  if(callback)
			  callback();	
	  }, "json"); 
 }
 
 //获取用户列表后开始长连接
 showUsers(function(){
	  longPoll();
 });
 
    	
});