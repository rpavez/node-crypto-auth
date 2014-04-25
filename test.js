var colors = require('colors');
var fs = require('fs');
var path = require('path');

var cryptoauth = require('./crypto-auth')({
	debug:true,
	jsonTokenStore: false,
	privateKey: require('path').resolve(__dirname,'certificates-test','auth.key'),
	supressAlerts:true
});

var cryptotools = cryptoauth.cryptoTools;

var heart_bleed = ["1.0.1","1.0.2-beta"];
var heart_bleed_false_positives = {
	'1.0.1g': true,
	'1.0.0' : true,
	'0.9.8' : true
};

function checkVersion(version){
	heart_bleed.forEach(function(v){
		if(version.match(v)&&!heart_bleed_false_positives) {console.log(version.red,"Your OpenSSL version is known to be vulnerable to heartbleed bug!!!!!!".red);return "";}
	});
	return "(Not Vulnerable to Hearthbleed bug)".green;
};

function MainTest(){
	try{
		var testCert = fs.readFileSync(path.resolve(__dirname,'certificates-test','auth.crt')).toString();
		var testPrivateKey = fs.readFileSync(path.resolve(__dirname,'certificates-test','auth.key')).toString();
		return cryptotools.checkCertificate(testCert,testPrivateKey);
	}
	catch(err)
	{
		console.log(err.message);
		if(err.message.match(/ENOENT/)) console.log("Files inside certificates-test folder not found.".yellow);
		console.log(err.stack);
		return false;
	}
}

function OpenSSLVersionTest(callback){
	require('child_process').exec('openssl version',
	  function (error, stdout, stderr) {
	  	stdout = stdout.toString();
	  	msg = stdout + checkVersion(stdout);
	    if(!error&&!stderr.match(/[a-zA-Z]/)) return callback(true,msg);
	    else return callback(false);
	});
}

function logTestResult(testName,result,data){
	if(result)
	{
		console.log(testName+" Test OK".green,(data ? data : ""));
	}
	else
	{
		console.log(testName+" Test FAILED".red);
	}
};

// Main Test
logTestResult( "Validate Certificate using Private Key" , MainTest() );
OpenSSLVersionTest(function(result,data){ logTestResult( "OpenSSL support" , result, data); });