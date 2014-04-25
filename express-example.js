var express = require('express');
var http = require('http');
var colors = require('colors');
var app = express();


app.set('port',3000);
app.use(express.methodOverride());
app.use(app.router);


var authProvider = require('./crypto-auth')(
{
	debug: true, 
	jsonTokenStore: false,
	privateKey: require('path').resolve(__dirname,'certificates','auth.key'),
	connectionPharase: 'welcome-to-my-api'
});

app.post('/api/requestToken',authProvider.requestToken);

app.post('/api/check',authProvider.auth ,function(req,res){
    return res.json({success: true});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log(('Express server listening on port ' + app.get('port')).green);
  console.log('Type: curl -F certificate=@certificates/auth.crt -X POST http://localhost:3000/api/requestToken to request token');
  console.log('Type: curl -H "token: 123456789" -X POST http://localhost:3000/api/check to check token');
});
