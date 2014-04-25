"use strict"
module.exports = function(config) {
	var cryptoTools = require('./cryptoTools')(config.privateKey);
	var formidable = require('formidable')
	var fs = require('fs');
	var path = require('path');
	var colors = require('colors');

	var debug = (config&&config.debug) ? config.debug : false; // Defaults to false
	var ttl = (config&&config.ttl) ? config.ttl : 5*60*1000; // Defaults to 5 minutes
	var jsonTokenStore = (config&&config.jsonTokenStore) ? config.jsonTokenStore : false; // Defaults to memory store

	if (!config.supressAlerts) {console.log("SECURITY ALERT: Crypto-Auth is in debug mode, anyone can access with token 123456789.".red);console.log("Set debug parameter to false to remove this alert".red);}

	// Tokens
	var tokens = {};

	function backupTokens(){
		fs.writeFile(path.resolve(__dirname,'tokens.json'), JSON.stringify(tokens), function(err) {
		  console.log("Tokens has been backed up");
		});
	};
	
	if(jsonTokenStore) restoreTokens();
	if(debug) tokens['123456789'] = 1;

	function restoreTokens(){
		tokens = JSON.parse( fs.readFileSync(path.resolve(__dirname,'tokens.json')).toString() );
		console.log("Tokens has been restored");
	};

	function randomTokenGenerator()
	{
	    return 'xxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
	        return v.toString(16);
	    });
	}

	function createToken(ttl){
		var token = randomTokenGenerator();
		tokens[token] = ttl;
		if(debug) console.log("Created token ",token," ttl ",ttl);
		if(jsonTokenStore) backupTokens();
		return token;
	};

	function removeToken(token){
		if(!tokens[token]) return true;
		delete tokens[token];
		return false;
	};

	function startTokensTTLWatch(){
		setInterval(function(){
			for(var token in tokens)
			{
				if(!tokens[token]) console.log("Alert: Token without TTL?");
				else tokens[token]--;
				if(tokens[token]==0)
				{
					removeToken(token);
					console.log("Token ",token," has expired!");
				}
			}
		},1000);
	};

	function checkToken(token){
			return (tokens[token] ? true : false);
	};

	if(!debug) startTokensTTLWatch();

	return {
		cryptoTools: cryptoTools,
		requestToken: function(req,res){
		    var form = new formidable.IncomingForm();
		    form.parse(req, function(err, fields, files) {
		        if(files.certificate)
		        {
			        var path = files.certificate.path;
			        var certificate = fs.readFileSync(path,'utf8');
			        fs.unlinkSync(path);

					if(cryptoTools.checkCertificate(certificate)) return res.send(createToken(ttl));
					else
					{
						return res.json({success:false,error:"Signed Certificate is invalid or has expired"},401);
					}
				}
				else return res.json({success:false,error:"File not sent."},500);
			});
		},
		auth: function(req,res,next){
			if(req.headers['token']&&checkToken(req.headers['token'])){
				req.token = req.headers['token'];
				next();
			}
			else {
				return res.json({success:false,error:"Access token is invalid or has expired"},401);
			}
		}

	};
}