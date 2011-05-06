/**
 * a simple chat-paint-room demo based on nodejs ，which means you can paint and chat with your chaters on realtime
 * @author hpf1908@gmail.com
 * @date 2011.05.07
 */

var express = require('express');

var app = express.createServer();
var port = 8024;

require('./boot').boot(app);

app.listen(port);
console.log('paint app started on port '+port);