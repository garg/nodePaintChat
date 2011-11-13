/**
 * a simple chat-paint-room demo based on nodejs ，which means you can paint and chat with your chaters on realtime
 * @author hpf1908@gmail.com
 * @date 2011.05.07
 */
var express = require('express'),
    form = require('connect-form'),
    config = require('./config');
var app = express.createServer(form({ keepExtensions: true , uploadDir : 'public/files'}));
var port = config.startParams.port;

require('./boot').boot(app);
app.listen(port);

console.log('app started on port '+port);
