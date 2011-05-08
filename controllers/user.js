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
/*
 *defined controller's actions
 */
module.exports = {
  
  //user exit 
  exit: function(req, res){
	var id = req.param('id');
	userService.destroy(id);
	res.sendJson(Success_Flag, 'ok', { rss: mem.rss,vsize:mem.vsize,heapTotal:mem.heapTotal,heapUsed:mem.heapUsed });
  },
  //send message
  sendMsg: function(req, res){
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
  },
  //send message
  sendOper: function(req, res){
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
  },
  //subcribse for long pull
  subscribse: function(req, res){
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
  },
  //join in the room
  join:function(req, res){
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
  },
  //get all the current users
  getAll:function(req, res){
	var users=userService.getUsers();
	res.sendJson(Success_Flag,'ok',{nicks:users});
  },
  methods:{
	exit:'get',
	getAll:'get',
	join:'get',
	subscribse:'get'
  }
};