//----------------------------------------------------------------------------------------------------------------------
// Represents all the communication logic for a farnsworth connection.
//
// @module farnsworth.js
//----------------------------------------------------------------------------------------------------------------------

var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

var FarnsworthProtocol = require('./protocol/protocol');
var config = require('../config');

var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

function Farnsworth(server, address)
{
    EventEmitter.call(this);

    this.status = 'unknown';
    this.server = server;

    // Build our protocol object from whatever we got passed; this could be a string, a socket instance, or a Protocol.
    this._buildProtocol(address, function()
    {
        // Connect event handlers
        this._connectHandlers();

        this.emit('initialized');
    }.bind(this));
} // end Farnsworth

util.inherits(Farnsworth, EventEmitter);

Farnsworth.prototype._buildProtocol = function(address, done)
{
    if(address instanceof FarnsworthProtocol)
    {
        this.status = 'connected';
        this.protocol = address;

        done();
    }
    else if(address instanceof net.Socket)
    {
        this.status = 'connected';
        this.protocol = new FarnsworthProtocol(address);

        done();
    }
    else if(typeof address == 'string')
    {
        var connection = net.connect({host: address, port: config.get('listenPort', 1313)}, function()
        {
            this.status = 'connected';
            this.protocol = new FarnsworthProtocol(connection);

            done();
        }.bind(this));
    }
    else
    {
        logger.error("Can't build protocol object for object:", logger.dump(address));
    } // end if
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