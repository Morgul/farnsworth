//----------------------------------------------------------------------------------------------------------------------
// This is the main logic for the Farnsworth code.
//
// @module server.js
//----------------------------------------------------------------------------------------------------------------------

var net = require('net');

var config = require('../config');
var Protocol = require('./protocol/protocol');
var ConnectionManager = require('./conn_man');
var nmap = require('./nmap/nmap.js').setup({ interface: 'en0' });

var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

function FarnsworthServer()
{
    // A list of ip addresses known to be farnsworths
    this.farnsworths = [];

    this.tcpServer = net.createServer(this._handleConnection.bind(this));
    this.connMan = new ConnectionManager(this);
} // end FarnsworthServer

FarnsworthServer.prototype._handleConnection = function(socket)
{
    var protocol = new Protocol(socket);
    this.connMan.addConnection(protocol);
}; // end _handleConnection

FarnsworthServer.prototype.start = function()
{
    logger.info('Listening for connections on port ' + config.get('listenPort', 1313));

    // Start our TCP server, so other Farnsworths can talk to us.
    this.tcpServer.listen(config.get('listenPort', 1313));

    // Discovery other Farnsworths
    this.autodiscover();
}; // end start

FarnsworthServer.prototype.autodiscover = function()
{
    var self = this;

    logger.info('Starting Farnsworth autodiscovery...');

    // Step 1, use nmap to determine what ip addresses are available
    nmap.findActiveHosts(function(error, active)
    {
        // Attempt to connect to all our possibles
        active.forEach(function(address)
        {
            // Step 3, attempt to connect on port 1313
            var socket = net.connect({ host: address, port: 1313 }, function()
            {
                var protocol = new Protocol(socket);
                self.connMan.addConnection(protocol);

                // Step 4, if connected, ask for list of known farnsworths
                protocol.send({
                    type: 'list farnsworths'
                });

                // Step 6, add this connection to a list of known farnsworths
                self.farnsworths.push(protocol.address);
            });

            // Ignore errors
            socket.on('error', function(){});
        });

        logger.info('Farnsworth autodiscovery complete.');
    });
}; // end autodiscover

//----------------------------------------------------------------------------------------------------------------------

module.exports = FarnsworthServer;

//----------------------------------------------------------------------------------------------------------------------