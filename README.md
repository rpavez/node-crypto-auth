node-crypto-auth
=======================

middleware for Node.js implementing API Auth based on  SSL Certificate
authentication/authorization

Copyright © May, 2014 Rodrigo Pavez

[![Build Status](https://travis-ci.org/rpavez/node-crypto-auth.png)](https://travis-ci.org/rpavez/node-crypto-auth)

API Authentication Middleware based on Signed-Certificates (SHA-256) and Token based sessions.

The basic idea is distributing signed-certificates files to protect your API instead of use a classic api key.
You'll as many api clients as certificates you generate, each of them may have different expiration date.

Why? Certificates provide the chance to set expiration date flexibility. You can generate new certificates offline. 
Companies who communicate each others demand extremely secure APIs. Sharing an API-KEY for infinite length its just not good.

How it works
------------
1. You generate a custom self-signed certificate
2. You sign one or more certificates and distribute to users you want to have access this service
3. They execute a REST call sending this certificate in order to get a temporary access token.
4. They can safely use this token to execute requests

How generate certificates
----------------------------

Generate Private key and Self-Signed Certificate
------------------------------------------------
    npm testopenssl req -nodes -sha256 -newkey rsa:2048 -keyout auth.key -out auth.csr
    npm testopenssl req -new -key auth.key -out auth.csr

Generate New Signed Certificates
--------------------------------
    openssl x509 -req -days 365 -in auth.csr -signkey auth.key -out auth.crt
(You can also include -startdate YYMMDDHHMMSSZ - The format of the date is YYMMDDHHMMSSZ (the same as an ASN1 UTCTime structure)

Installing
----------

node-crypto-auth is available from [npm](https://npmjs.org/package/node-crypto-auth.).

    $ npm install node-crypto-auth

Usage (Using Express)
---------------------

    var authProvider = require('./crypto-auth')(
    {
    	debug: true, 
    	jsonTokenStore: false,
    	privateKey: require('path').resolve(__dirname,'certificates','auth.key')
    });
    
    app.post('/api/requestToken',authProvider.requestToken);
    
    app.post('/api/check',authProvider.auth ,function(req,res){
        return res.json({success: true});
    });


Testing (with curl)
-------------------
(Go to crypto-auth and run node express-example.js to launch the example )
    curl -F certificate=@certificates/auth.crt -X POST http://localhost:3000/api/requestToken
    curl -H "token: 123456789" -X POST http://localhost:3000/api/check


Testing (with npm)
---------------
    npm test
(It will verify scripts work and OpenSSL is correctly installed.)

Notes
-----
I know storing requestsTokens in memory can be a problem, for now you can use jsonTokenStore: true to store it on a temporary file. Further release will allow use custom stores.

For extreme security
--------------------
Give your clients a bash script to let them generate new certificates to send as a password and validate their identity. Avoiding reuse of certificates would make every request connection unique making every new request require a new certificate to validate. This would be good for NON-HTTPS connections. Problem, added complexity.