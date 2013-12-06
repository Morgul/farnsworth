//----------------------------------------------------------------------------------------------------------------------
// The main application module for the Farnsworth.
//
// @module farnsworth.js
//----------------------------------------------------------------------------------------------------------------------

var package = require('./package');
var FarnsworthServer = require('./lib/server');

var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

// Print version
logger.info("Farnsworth Server v" + package.version);

var server = new FarnsworthServer();

server.start();

//----------------------------------------------------------------------------------------------------------------------