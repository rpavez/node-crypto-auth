"use strict"
module.exports = function(privateKeyPath) {

	var crypto = require("crypto");
	var fs = require('fs');
	
	var privateKey = privateKeyPath? fs.readFileSync(privateKeyPath).toString() : null;

	function signData(data,inPrivateKey){
		// Generate signature
		var key = (inPrivateKey)? inPrivateKey : privateKey;
		var signer = crypto.createSign('RSA-SHA256');
		signer.update(data);
		var signedData64 = signer.sign(key, 'base64');
		return signedData64;
	}

	function checkSignedData(signedData,expectedData,cert)
	{
		// Check signature
		var verifier = crypto.createVerify("RSA-SHA256");
		verifier.update(expectedData);
		var res = verifier.verify(cert, signedData, "base64");
		return res;
	}
	function generateCetificate(callback)
	{
		// Generate certificates
		var exec = require('child_process').exec,
		    child;

		child = exec('openssl x509 -req -days 365 -in certificates/auth.csr -signkey auth.key',
		  function (error, stdout, stderr) {
		  	stdout = stdout.toString();
		    return callback(stdout);
		});
	}

	function randomValueBase64 (len) {
	    return crypto.randomBytes(Math.ceil(len * 3 / 4))
	        .toString('base64')  
	        .slice(0, len)       
	        .replace(/\+/g, '0') 
	        .replace(/\//g, '0');
	}

	function checkCertificate(cert,inPrivateKey){
		var key = (inPrivateKey)? inPrivateKey : privateKey;
		var data = randomValueBase64(10);
		var signedData = signData(data,key);
		var result = checkSignedData(signedData,data,cert);
		return result;
	}

	return {
		signData : signData,
		checkSignedData : checkSignedData,
		checkCertificate : checkCertificate,
		generateCetificate : generateCetificate
	}

}