$(function(){
	
	var log=Painter.Util.log,
	    center=Painter.Util.center,
	    util=Painter.Util,
		Module=Painter.Gui.Module;
 	
    var client = new Module({
    	container:'#painter',
        title: "聊天室",
        x: 300,
        y: 200,
        width:300,
        contents: 
        ['<div class="login">\
           <div class="logform tw_new_login">\
	         <div class="passportc">\
         		<div class="tip tw_login_tip">输入您的昵称</div>\
         		<div style="display:none;" class="tip tw_login_tip error"><em>xxx</em></div>\
	         	<div class="frm">\
	         		<i class="txt">\
	         			<input type="text" name="nick" class="ppinput ppinput_ssl blur" autocomplete="off" disableautocomplete="" value="" style="color: black;">\
	         		</i>\
	         	</div>\
	         	<div class="frm">\
	         		<input type="button" name="login" value="登录" href="javascript:void(0);"></input>\
	         	</div>\
	         </div>\
	       </div>\
	      </div>'],
		
		
        onload: function () {
            var $loginEL = $(this.M[0]),
            	$loginInputEl=$loginEL.find('input[name$="nick"]'),
            	self=this,
            	$loginBtn=$loginEL.find('input[name$="login"]');
            
            $loginBtn.click(function(){
            	var val=$.trim($loginInputEl.val());
            	if(val==''){
            		self.showError('昵称不能为空');
            		return;
            	}
            	
            	self.hideError();
            	self.login(val);
            });
            
            this.showError=function(msg){
            	$loginEL.find('div.error').html('<em>'+msg+'</em>').show();
            }
            
            this.hideError=function(){
            	$loginEL.find('div.error').html('').hide();
            }
            
            this.login=function(nick){
                $.ajax({ 
            	 	cache: false, 
            	 	type: "GET", 
            	 	dataType: "json", 
            	 	url: "/users/join", 
            	 	data: { nick: nick }, 
            	 	error: function () {
            	 		self.showError('无法连接服务器');
            		}, 
            		success: function(json){
            			if(json.status==1)
            	 		   self.connect(json);
            			else
            				self.showError('昵称有重名');
            		}
            	 });
            }
            
            this.connect=function(json){

       		   var session = json.data;
       		   Painter.CONFIG={
       			 nick : session.nick,
       			 id : session.id,
       			 last_message_time :1,
       			 msgid:0
       		   }
       		  // starttime   = new Date(session.starttime);
       		  // rss         = session.rss;
       		  
       		   self.M.hide();
       		   self.appendScript("js/painter/init.js");
       		   self.appendScript("js/chat/client.js");
            }
            
            this.appendScript=function(src){
	        	var head = document.getElementsByTagName("head")[0];
	        	var script = document.createElement("script");
	        	script.type="text/javascript";
	        	script.src = src;
	        	head.appendChild(script); 
            }                   
       
        }
    });
    
    center(client.M[0]);
         	
});