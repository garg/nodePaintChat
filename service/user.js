var sys = require("sys"),
	url = require("url"),
	qs = require("querystring");

var MESSAGE_BACKLOG = 200,
	SESSION_TIMEOUT = 60 * 1000,
	MESSAGE_NUM = 0,
	HISTORY_NUM = 20;

var channel = new function () {
	var messages = [],
	  callbacks = [];
	
	this.appendMessage = function (nick, type) {
		
		MESSAGE_NUM++;
		
		var m = { 
			nick: nick, 
			type: type,  // "msg", "join", "part"
			timestamp: (new Date()).getTime(),
			msgid:MESSAGE_NUM
		};

		switch (type) {
		  case "msg":
			m.text = arguments[2];
		   // sys.puts("<" + nick + "> " + m.text);
		    break;
		  case "join":
			m.text = arguments[2];
		   // sys.puts(nick + " join");
		    break;
		  case "part":
			m.text = arguments[2];
		    //sys.puts(nick + " part");
		    break;
		  case "oper":
			m.pos = arguments[2];
			m.options=arguments[3];
			m.subtype=arguments[4];
			//sys.puts(nick + " oper");
			break;
		}	

		messages.push( m );	
		while (callbacks.length > 0) {
			callbacks.shift().callback([m]);
		}
	
		while (messages.length > MESSAGE_BACKLOG)
			messages.shift();
	};
	
	this.query = function (since, msgid, callback) {	
		
		var matching = [],
			head=MESSAGE_NUM>=MESSAGE_BACKLOG?MESSAGE_NUM-MESSAGE_BACKLOG+1:1;	
			
		if(msgid<MESSAGE_NUM){
			var index=msgid>=head?msgid-head+1:0;
			for(var i=index,len=messages.length;i<len;i++){
				console.log(i);
			    matching.push(messages[i]);	
			}		
		}
		
		if (matching.length != 0) {
		  callback(matching);
		} else {
		  callbacks.push({ timestamp: new Date(), callback: callback });
		}
	};
	
	// clear old callbacks
	// they can hang around for at most 30 seconds.
	setInterval(function () {
		var now = new Date();
		while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000) {
		  callbacks.shift().callback([]);
		}
	}, 3000);
};

var sessions = {} , guid=1 ,nicks ={};

//interval to kill off old sessions
setInterval(function () {
  var now = new Date();
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var session = sessions[id];

    if (now - session.timestamp > SESSION_TIMEOUT) {
      session.destroy();
    }
  }
}, 1000);


module.exports = {
  getUsers:function(){
    var nicks = [];
    for (var id in sessions) {
      if (!sessions.hasOwnProperty(id)) continue;
      var session = sessions[id];
      nicks.push(session.nick);
    }
    return nicks;
  },
  createSession:function(nick){
	console.log(nick);
    if(nicks[nick]) return null;

    var session = { 
      nick: nick, 
      id: guid ++,
      timestamp: new Date(),

      poke: function () {
        session.timestamp = new Date();
      },

      destroy: function () {
        channel.appendMessage(session.nick, "part");
        delete nicks[session.nick];
        delete sessions[session.id];
      }
    };

    nicks[session.nick] =true;
    sessions[session.id] = session;
    return session;
  },
  getSessionById:function(id){
	return sessions[id];  
  },
  destroy:function(id){
	var session;
	if (id && sessions[id]) {
	  session = sessions[id];
	  session.destroy();
	}	  
  },
  subcribse:function(id){
	var session;
	if (id && sessions[id]) {
	  session = sessions[id];
	  session.poke();
	}	  
  },
  query:function(since,msgid,callback){
	channel.query(since, msgid, function(messages){
	  callback(messages);
	});
  },
  sendMsg:function(nick ,msg){
	channel.appendMessage(nick, 'msg', msg);
  },
  sendOper:function(nick ,pos, options ,subtype){
	channel.appendMessage(nick, 'oper',pos, options ,subtype); 
  },
  join:function(nick){
	channel.appendMessage(nick, 'join');  
  },
  getMsgNum:function(){
	 return MESSAGE_NUM - HISTORY_NUM >=0?MESSAGE_NUM - HISTORY_NUM:0;
  }
}
