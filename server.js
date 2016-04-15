"use strict";

const Hapi = require('hapi');
const Good = require('good');
const JWT = require('jsonwebtoken');

const server = new Hapi.Server();
server.connection({port: 3000});

var accounts = {
    123: {
        id: 123,
        user: 'Tom',
        fullname: 'Tom Raine',
        scope: ['a', 'b']
    }
};

var privateKey = 'AbC123DeF456GhI789JkL0';

// Use this token to build your request with the 'Authorization' header.
// Ex:
//     Authorization: Bearer <token>
var token = JWT.sign({accountId: 123}, privateKey, {algorithm: 'HS256'});

var validate = function(request, decodedToken, callback){
    var error,
        credentials = accounts[decodedToken.accountId] || {};

    if(!credentials){
        return callback(error, false, credentials);
    }

    return callback(error, true, credentials)
};

server.route({
    method: 'GET',
    path: '/',
    handler: function(req, res){
        res("Hello World!");
    }
});

server.route({
    method: 'GET',
    path: '/{name}',
    handler: function(req, res){
        res("Hello, " + encodeURIComponent(req.params.name) + "!");
    }
});


server.register([require('inert'), require('hapi-auth-jwt')], (err) => {
    if(err){
        throw err;
    }

    server.auth.strategy('token', 'jwt', {
        key: privateKey,
        validateFunc: validate,
        verifyOptions: {algorithm: [ 'HS256' ]} //only allow hS256 algorithm
    });

    server.route({
        method: 'GET',
        path: '/hello',
        config: {
            auth:{
                strategy: 'token',
                scope: ['a']
            }
        },
        handler: function(req, res){
            res.file('./public/index.html');
        }
    });
});

server.register({
    register: Good,
    options: {
        reporters: [{
            reporter: require('good-console'),
            events: {
                response: '*',
                log: '*'
            }
        }]
    }
}, (err) => {
    if(err){
        throw err; //something happend loading the plugin
    }
    server.start((err) => {
        if(err){
            throw err;
        }
        server.log('info', 'Server running at:' + server.info.uri);
        server.log('info', 'curl --header "Authorization: Bearer ' + token + '" ' + server.info.uri + '/hello')
    });
});
