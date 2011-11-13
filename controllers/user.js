var userService = require('../service/user');

//mark down start time
var starttime = (new Date()).getTime();

var mem = process.memoryUsage();
//every 10 seconds poll for the memory.
setInterval(function () {
  mem = process.memoryUsage();
}, 10*1000);

var Success_Flag = 1,
    Fail_Flag = 0;

module.exports = [{
	url : ['/users/exit'],
	view : '',
	methods : ['get'],
	excute : function(req, res  , next ) {
		var id = req.param('id');
		userService.destroy(id);
		res.sendJson(Success_Flag, 'ok', { rss: mem.rss,vsize:mem.vsize,heapTotal:mem.heapTotal,heapUsed:mem.heapUsed });
	}
},{
	url : ['/users/sendMsg'],
	view : '',
	methods : ['post'],
	excute : function(req, res  , next ) {
		var id = req.param('id'),
		    text = req.param('text'),
		    session = userService.getSessionById(id);
		if (!session || !text) {
		  res.sendJson(Fail_Flag, 'No such session id or no text');
		  return;
		}
		session.poke();
		userService.sendMsg(session.nick, text);
		res.sendJson(Success_Flag, 'ok', { rss: mem.rss,vsize:mem.vsize,heapTotal:mem.heapTotal,heapUsed:mem.heapUsed });
	}
},{
	url : ['/users/sendOper'],
	view : '',
	methods : ['post'],
	excute : function(req, res  , next ) {
		var id = req.param('id'),
			pos = req.param('pos'),
			options=req.param('options'),
			subtype=req.param('subtype'),
		    session = userService.getSessionById(id);
		if (!session) {
		  res.sendJson(Fail_Flag, 'No such session id ');
		  return;
		}
		session.poke();
		userService.sendOper(session.nick, pos, options ,subtype);
		res.sendJson(Success_Flag, 'ok', { rss: mem.rss,vsize:mem.vsize,heapTotal:mem.heapTotal,heapUsed:mem.heapUsed });
	}
},{
	url : ['/users/subscribse'],
	view : '',
	methods : ['get'],
	excute : function(req, res  , next ) {
		if (!req.param('since')||!req.param('msgid')) {
		  res.sendJson(Fail_Flag, 'Must supply since parameter');
		  return;
	    }
		var id = req.param('id'), 
		    msgid= parseInt(req.param('msgid')), 
		    since = parseInt(req.param('since'), 10),
		    session = userService.getSessionById(id);
		
		userService.subcribse(id);
	    userService.query(since, msgid, function (messages) {
	    	if (session) 
	    		session.poke();
	    	res.sendJson(Success_Flag, 'ok', { messages: messages, rss: mem.rss,vsize:mem.vsize,heapTotal:mem.heapTotal,heapUsed:mem.heapUsed  });
		});	
	}
},{
	url : ['/users/join'],
	view : '',
	methods : ['get'],
	excute : function(req, res  , next ) {
		var nick = req.param('nick');
		if (nick == null || nick.length == 0) {
		  res.sendJson(Fail_Flag, 'Bad nick');
		  return;
		}
	
		var session = userService.createSession(nick);
		if (session == null) {
		  res.sendJson(Fail_Flag, 'Nick in use');
		  return;
		}
		//sys.puts("connection: " + nick + "@" + res.connection.remoteAddress);
		userService.join(session.nick);
		res.sendJson(Success_Flag, 'join in success',{ 
	      id: session.id, 
		  nick: session.nick, 
		  rss: mem.rss,
		  vsize:mem.vsize,
		  heapTotal:mem.heapTotal,
		  heapUsed:mem.heapUsed,
		  starttime: starttime,
		  msgid:userService.getMsgNum()
		});
	}
},{
	url : ['/users/getAll'],
	view : '',
	methods : ['get'],
	excute : function(req, res  , next ) {
		var users=userService.getUsers();
		res.sendJson(Success_Flag,'ok',{nicks:users});
	}
}];



