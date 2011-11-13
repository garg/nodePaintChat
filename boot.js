/**
 * dependency
 */
var fs = require('fs')
  , express = require('express')
  , url = require('url')
  , config = require('./config');
	
exports.boot = function(app){
  bootApplication(app);
  bootControllers(app);
};

// App settings and middleware 
function bootApplication(app) {

  //app.use(express.logger(':method :url :status'));
  app.use(express.bodyParser()); 
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  
   // set default layout, usually "layout"
  app.set('view options', {
	  layout: 'layouts/default',
	  open: '<<',
      close: '>>'
  });
  
  // Example 404 page via simple Connect middleware
  app.use(function(req, res){
  	var opt = {request:req};
  	setGlobalInfo(opt , req, res);
    res.render('404' , opt);
  });  
  
  // Example 500 page
  app.error(function(err, req, res){
    //console.dir(err);
    var opt = {request:req};
  	setGlobalInfo(opt , req, res);
    res.render('500',opt);
  });
  
  // Setup ejs views as default, with .html as the extension
  app.set('views', __dirname + '/views');
  app.register('.html', require('ejs'));
  app.set('view engine', 'html');
  
  // Some dynamic view helpers
  app.dynamicHelpers({
    request: function(req){
      return req;
    },
    hasMessages: function(req){
      if (!req.session) return false;
      return Object.keys(req.session.flash || {}).length;
    },
    messages: function(req){
      return function(){
        var msgs = req.flash();
        return Object.keys(msgs).reduce(function(arr, type){
          return arr.concat(msgs[type]);
        }, []);
      }
    }
  });
}

// Bootstrap controllers
function bootControllers(app) {
  fs.readdir(__dirname + '/controllers', function(err, files){
    if (err) throw err;
    files.forEach(function(file){
      bootController(app, file);
    });
  });
}

// (simplistic) controller support
function bootController(app, file) {
  var controller = file.replace('.js', '')
    , actions = require('./controllers/' + controller);
  Object.keys(actions).map(function(key){
  	 var action = actions[key],
     	  fn = controllerAction(controller, key , action);
     	  
     var MapAction = function(method , url){
     	var urls = Object.prototype.toString.apply(url) === '[object Array]'? url : [url];
     	for(var i=0;i<urls.length;i++){
	     	console.log(urls[i] +' '+ method);
	     	app[method](urls[i],fn);
     	}
     }
     if(action.methods && action.methods.length>0) {
     	for(var i=0;i<action.methods.length;i++) {
	     	 var method = action.methods[i];
	     	 MapAction(method , action.url);     	 
	      } 	
     } else {
     	MapAction('get' , action.url);
     }   
  });
}

function setGlobalInfo(options , req, res){
}

function controllerAction(controller , key , action  ) {
  return function(req, res, next){
    var render = res.render, 
        format = req.params.format, 
        view = action.view ,
        path = __dirname + '/views/' + controller + '/' + view + '.html';
    res.render = function(obj, options, fn){
      res.render = render;
      if (typeof obj === 'string') {
        return res.render(obj, options, fn);
       }
      options = options || {};      
      for(var name in obj) {
         options[name] = obj[name];
       }
      setGlobalInfo(options , req, res);
     
      return res.render(path, options, fn);
    };
    
    res.sendJson = function(status, statusText, data, view){
	  var result={
	    status:status,
	    statusText:statusText
	  };  
	  if(data)
		  result.data = data;
	  if(view)
		  result.view = view;	  
	  return res.send(result);
	};
	
    action.excute.call(this, req, res, next);
  };
}
