/**
 * dependency
 */

var fs = require('fs')
  , express = require('express');

exports.boot = function(app){
  bootApplication(app);
  bootControllers(app);
};

// App settings and middleware 
function bootApplication(app) {
  app.use(express.logger(':method :url :status'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  // Example 500 page
  app.error(function(err, req, res){
    console.dir(err)
    res.render('500');
  });

  // Example 404 page via simple Connect middleware
  app.use(function(req, res){
    res.render('404');
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
  var name = file.replace('.js', '')
    , actions = require('./controllers/' + name)
    , plural = name + 's' // realistically we would use an inflection lib
    , prefix = (name=='home')?'':'/' + plural; 

  var methods=actions.methods || {};
  
  Object.keys(actions).map(function(action){
	if(action=='methods') return;
	
	//notice: default method type is post 
    var fn = controllerAction(name, plural, action, actions[action]),
    	method=methods[action]?methods[action]:'post';
    	
    console.log(prefix + '/'+action+' '+method);
    if(action=='index')
		app[method](prefix + '/', fn);
	else
		app[method](prefix + '/'+action, fn); 
  });
}

/*
 * Proxy res.render() to config common views path or something else
 * extend res.sendJson() to config all the response for json format
 */
function controllerAction(name, plural, action, fn) {
  return function(req, res, next){
    var render = res.render, 
        format = req.params.format, 
        path = __dirname + '/views/' + name + '/' + action + '.html';
      
    res.render = function(obj, options, fn){
      res.render = render;
      // Template path
      if (typeof obj === 'string') {
        return res.render(obj, options, fn);
      }

      // Render template
      res.render = render;
      options = options || {};
      // Expose obj as the "users" or "user" local
      if (action == 'index') {
        options[plural] = obj;
      } else {
        options[name] = obj;
      }
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
	
	//excute real action
    fn.apply(this, arguments);
  };
}