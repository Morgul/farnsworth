//----------------------------------------------------------------------------------------------------------------------
// The connection manager; listens for messages on our connections, and responds to them.
//
// @module conman.js
//----------------------------------------------------------------------------------------------------------------------

var _ = require('lodash');

var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

function ConnectionManager(server)
{
    this.server = server;
    this.connections = {};
} // end ConnectionManager

ConnectionManager.prototype.addConnection = function(connection)
{
    // Setup listeners
    this._setupListeners(connection);

    // Add to our known list of connections
    this.connections[connection.address] = connection;
}; // end addConnection

ConnectionManager.prototype._setupListeners = function(connection)
{
    var self = this;

    connection.on('known farnsworths', function(message)
    {
        // Step 5, iterate over their list, and add anyone we don't already know to the known list of known
        message.farnsworths.forEach(function(address)
        {
            if(!_.contains(self.server.farnsworths, address))
            {
                self.server.farnsworths.push(address);
            } // end if
        });
    });

    connection.on('list farnsworths', function()
    {
        connection.send({
            type: 'known farnsworths',
            farnsworths: self.server.farnsworths
        })
    });
}; // end _setupListeners

//----------------------------------------------------------------------------------------------------------------------

module.exports = ConnectionManager;

//----------------------------------------------------------------------------------------------------------------------