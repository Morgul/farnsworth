//----------------------------------------------------------------------------------------------------------------------
// Represents all the communication logic for a farnsworth connection.
//
// @module farnsworth.js
//----------------------------------------------------------------------------------------------------------------------

var net = require('net');

var _ = require('lodash');

var FarnsworthProtocol = require('./protocol/protocol');
var config = require('../config');

var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

function Farnsworth(server, address)
{
    this.status = 'unknown';
    this.server = server;

    // Build our protocol object from whatever we got passed; this could be a string, a socket instance, or a Protocol.
    this._buildProtocol(address);

    // Connect event handlers
    this._connectHandlers();
} // end Farnsworth

Farnsworth.prototype._buildProtocol = function(address)
{
    if(address instanceof FarnsworthProtocol)
    {
        this.status = 'connected';
        return this.protocol = address;
    } // end if

    if(address instanceof net.Socket)
    {
        this.status = 'connected';
        return this.protocol = new FarnsworthProtocol(address);
    } // end if

    if(address instanceof String)
    {
        var connection = net.connect({host: address, port: config.get('listenPort', 1313)}, function()
        {
            this.status = 'connected';
            this.protocol = new FarnsworthProtocol(connection);
        }.bind(this));
    } // end if

    logger.error("Can't build protocol object for object:", logger.dump(address));
};

Farnsworth.prototype._connectHandlers = function()
{
    //------------------------------------------------------------------------------------------------------------------
    // Discovery
    //------------------------------------------------------------------------------------------------------------------

    this.protocol.on('discovery', function(message)
    {
        if(message.id && !(message.id in this.server.farnsworths))
        {
            this.server.farnsworths[message.farnsworthID] = this.protocol.address;
        } // end if

        this.protocol.send({
            farnsworthID: config.get('farnsworthID', 12),
            type: 'discovery response',
            farnsworths: this.server.farnsworths
        })
    }.bind(this));

    //------------------------------------------------------------------------------------------------------------------
    // Discovery Response
    //------------------------------------------------------------------------------------------------------------------

    this.protocol.on('discovery response', function(message)
    {
        if(message.farnsworthID)
        {
            this.server.farnsworths[message.farnsworthID] = this.protocol.address;
        }
        else
        {
            logger.warn('Discovery response did not contain id:', logger.dump(message));
        } // end if

        if(message.farnsworths || message.farnsworths == [])
        {
            message.farnsworths.forEach(function(address, id)
            {
                if(!_.contains(this.server.farnsworths, address))
                {
                   this.server.farnsworths[id] = address;
                } // end if
            }.bind(this));
        }
        else
        {
            logger.warn('Discovery response did not contain known farnsworths:', logger.dump(message));
        } // end if
    }.bind(this));
}; // end _connectHandlers

//----------------------------------------------------------------------------------------------------------------------

module.exports = Farnsworth;

//----------------------------------------------------------------------------------------------------------------------