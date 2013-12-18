//----------------------------------------------------------------------------------------------------------------------
// Defines the protocol for network communications.
//
// @module protocol
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var ns = require('./netstring');
var JSONDecodeStream = require('./json_stream');

//----------------------------------------------------------------------------------------------------------------------

function FarnsworthProtocol(tcpStream)
{
    EventEmitter.call(this);

    // Setup tcp stream
    this.tcp = tcpStream;
    this.tcp.setEncoding('utf8');

    // Setup events
    this.tcp.on('listening', function()
    {
        this.emit('listening');
    }.bind(this));

    this.tcp.on('connection', function(socket)
    {
        this.emit('connection', socket);
    }.bind(this));

    this.tcp.on('close', function()
    {
        this.emit('close');
    }.bind(this));

    this.tcp.on('error', function(error)
    {
        this.emit('error', error);
    }.bind(this));

    // Setup transform streams
    this.ns_encode = new ns.NSEncodeStream();
    this.ns_decode = new ns.NSDecodeStream();
    this.json_decode = new JSONDecodeStream();

    // Connect pipes
    this.tcp.pipe(this.ns_decode);
    this.ns_decode.pipe(this.json_decode);
    this.ns_encode.pipe(this.tcp);

    // Connect message handling
    this.json_decode.on('data', this.handleMessages.bind(this));
} // end FarnsworthProtocol

FarnsworthProtocol.prototype = {
    get address()
    {
        return this.tcp.address().address;
    }, // end address

    get port()
    {
        return this.tcp.address().port;
    } // end port
}; // end prototype

util.inherits(FarnsworthProtocol, EventEmitter);

FarnsworthProtocol.prototype.send = function(msg)
{
    this.ns_encode.write(JSON.stringify(msg));
}; // end send

FarnsworthProtocol.prototype.handleMessages = function(message)
{
    // We just emit an event with the name of the message type, and the full message, for simplicity's sake.
    this.emit(message.type, message);
};

//----------------------------------------------------------------------------------------------------------------------

module.exports = FarnsworthProtocol;

//----------------------------------------------------------------------------------------------------------------------