//----------------------------------------------------------------------------------------------------------------------
// This is the main logic for the Farnsworth code.
//
// @module server.js
//----------------------------------------------------------------------------------------------------------------------

var net = require('net');

var config = require('../config');

var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

function FarnsworthServer()
{
    this.tcpServer = net.createServer(this._handleConnection.bind(this));
} // end FarnsworthServer

FarnsworthServer.prototype._handleConnection = function()
{
    logger.warn('Incoming Connection! We don\'t handle this, currently!');
}; // end _handleConnection

FarnsworthServer.prototype.start = function()
{
    // Start our TCP server, so other Farnsworths can talk to us.
    this.tcpServer.listen(config.get('listenPort', 1313));

    // Discovery other Farnsworths!
    this.autodiscover();
}; // end start

FarnsworthServer.prototype.autodiscover = function()
{
    //TODO: implement this.
}; // end autodiscover

//----------------------------------------------------------------------------------------------------------------------

module.exports = FarnsworthServer;

//----------------------------------------------------------------------------------------------------------------------