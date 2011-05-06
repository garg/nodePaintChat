/**
 * Module dependencies.
 * @author hpf1908@gmail.com
 */

var express = require('express');

var app = express.createServer();
var port = 8024;

require('./boot').boot(app);

app.listen(port);
console.log('paint app started on port '+port);