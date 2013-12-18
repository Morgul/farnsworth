//----------------------------------------------------------------------------------------------------------------------
// Modules that emulates some of nmap's functionality.
//
// Written by David H. Bronke <whitelynx@gmail.com>, adapted by Christopher S. Case <chris.case@g33xnexus.com>.
//
// @module nmap.js
//----------------------------------------------------------------------------------------------------------------------

var net = require('net');
var os = require('os');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var async = require('async');

var config = require('../config');
var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

function NMapController()
{
    EventEmitter.call(this);

    // Default timeout when attempting to connect
    this.timeout = 5000;

    // Add our properties
    this._buildProperties();
} // end NMapController

util.inherits(NMapController, EventEmitter);

NMapController.prototype._buildProperties = function()
{
    // NMapController.interface
    Object.defineProperty(this, 'interface', {
        enumerable: true,
        get: function()
        {
            if(!this._interface)
            {
                // Setup defaults for the various platforms.
                switch(process.platform)
                {
                    case 'win32':
                    {
                        this._interface = 'Local Area Connection';
                        break;
                    } // end case 'win32'

                    case 'darwin':
                    {
                        this._interface = 'en0';
                        break;
                    } // end case 'darwin'

                    default:
                    {
                        this._interface = 'eth0';
                        break;
                    } // end default
                } // end switch
            } // end if

            return this._interface;
        },
        set: function(value)
        {
            this._interface = value;
        }
    });

    // NMapController.address
    Object.defineProperty(this, 'address', {
        enumerable: true,
        get: function()
        {
            var interfaces = os.networkInterfaces();
            if(this.interface in interfaces)
            {
                return _.filter(interfaces[this.interface], { family: 'IPv4', internal: false })[0].address;
            } // end if

            return undefined;
        }
    });

    // NMapController.addrPrefix
    Object.defineProperty(this, 'addrPrefix', {
        enumerable: true,
        get: function()
        {
            return this.address.slice(0, this.address.lastIndexOf('.') + 1);
        }
    });

    // NMapController.addrLastByte
    Object.defineProperty(this, 'addrLastByte', {
        enumerable: true,
        get: function()
        {
            return parseInt(this.address.slice(this.address.lastIndexOf('.') + 1), 10);
        }
    });
};

NMapController.prototype.findActiveHosts = function(port, keepConnection)
{
    var self = this;
    port = port || config.get('port', 1313);
    var activeHosts = [];
    var finished = [];

    async.each(_.range(1, 255), function(lastByte, done)
    {
        function finish()
        {
            // Prevent double calling the callback
            if(!keepConnection && !_.contains(finished, lastByte))
            {
                done();
                finished.push(lastByte);
            } // end if
        } // end finish

        // Skip ourselves
        if(lastByte == self.addrLastByte)
        {
            return done();
        } // end if

        var addrToCheck = self.addrPrefix + lastByte;
        var client = net.connect({ host: addrToCheck, port: port }, function()
        {
            if(keepConnection)
            {
                activeHosts.push(client);

                // Since we won't be closing this, we call done ourselves.
                done();
            }
            else
            {
                activeHosts.push(addrToCheck);

                client.end();
                finish();
            } // end if
        }); // end net.connect

        // Handle errors
        client.on('error', function(error)
        {
            //console.log('[' + lastByte + '] errored.');

            // Cleanup
            client.end();
            finish();
        });

        // Set a timeout on connections
        client.setTimeout(self.timeout, function()
        {
            //console.log('[' + lastByte + '] timedout.');

            client.end();
            finish();
        });
    }, function()
    {
        self.emit('hosts found', activeHosts);
    });
}; // end findActiveHosts

//----------------------------------------------------------------------------------------------------------------------

module.exports = new NMapController();

//----------------------------------------------------------------------------------------------------------------------