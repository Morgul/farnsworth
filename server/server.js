//----------------------------------------------------------------------------------------------------------------------
// The main application module for the Farnsworth.
//
// @module farnsworth.js
//----------------------------------------------------------------------------------------------------------------------

var net = require('net');

var package = require('./package');
var config = require('./config');
var nmap = require('./lib/nmap.js');
var Farnsworth = require('./lib/farnsworth');

var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

function FarnsworthServer()
{
    // Known farnsworths
    this.farnsworths = {};

    // Current connections
    this.connections = [];

    // Create a TCP server, listening for incoming connections.
    this.tcpServer = net.createServer(this._handleConnection.bind(this));
} // end FarnsworthServer

FarnsworthServer.prototype._handleConnection = function(socket)
{
    this.connections.push(new Farnsworth(this, socket));
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
    logger.info('Starting Farnsworth autodiscovery...');

    nmap.on('hosts found', function(hosts)
    {
        logger.info('Hosts found:', hosts);

        hosts.forEach(function(socket)
        {
            var farnsworth = new Farnsworth(this, socket);

            // Tell it we're doing a discovery
            farnsworth.protocol.send({
                type: 'discovery',
                farnsworthID: config.get('farnsworthID', 12)
            });
        });
    }); // end on('found active hosts')

    nmap.findActiveHosts(config.get('listenPort', 1313));
}; // end autodiscover

//----------------------------------------------------------------------------------------------------------------------

// Print server version
logger.info("Farnsworth Server v" + package.version);

var server = new FarnsworthServer();

server.start();

//----------------------------------------------------------------------------------------------------------------------