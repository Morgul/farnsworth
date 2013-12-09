//----------------------------------------------------------------------------------------------------------------------
// Brief description for nmap.js module.
//
// @module nmap.js
//----------------------------------------------------------------------------------------------------------------------

var exec = require('child_process').exec;
var os = require('os');

var logger = require('omega-logger').loggerFor(module);

//----------------------------------------------------------------------------------------------------------------------

function NMapController(options)
{
    var self = this;
    this.options = options || {};
    this.command = "nmap -sP";

    if(this.options.useSudo)
    {
        this.command = 'sudo ' + this.useSudo;
    } // end

    var addresses = (os.networkInterfaces()[(this.options.interface || 'eth0')] || []);
    addresses.forEach(function(address)
    {
        if(address.family == 'IPv4')
        {
            self.address = address.address;

            // Replace the final number with the search range
            self.command += " " +  self.address.slice(0, self.address.lastIndexOf('.')) + '.0/24';
        } // end if
    });
} // end NMapController

NMapController.prototype.findActiveHosts = function(callback)
{
    var self = this;
    var addresses = [];

    logger.info('Scanning for active hosts...');

    var process = exec(this.command, function(error, stdout, stderr)
    {
        if(error)
        {
            logger.error('Encountered error running nmap:', error.stack || error.message || error);
        }
        else
        {
            var lines = stdout.split('\n');
            lines.forEach(function(line, index)
            {
                if(line.lastIndexOf('Nmap scan report', 0) === 0)
                {
                    // The ip address starts at index 21. (This could be replaced by a regexp, but I don't do regexps.)
                    var address = line.substring(21);

                    // Check to make sure that we get the 'Host is up' message
                    if(lines[index + 1].lastIndexOf('Host is up', 0) === 0 && address != self.address)
                    {
                        addresses.push(address);
                    } // end if
                } // end if
            });
        } // end if

        callback(error, addresses);
    });
}; // end findActiveHosts

//----------------------------------------------------------------------------------------------------------------------

var nmap = new NMapController();

//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    setup: function(options)
    {
        nmap = new NMapController(options);

        // Allow chaining
        return nmap;
    }, // end setup

    findActiveHosts: function(callback)
    {
        nmap.findActiveHosts(callback);

        // Allow chaining
        return nmap;
    } // end findActiveHosts
}; // end exports

//----------------------------------------------------------------------------------------------------------------------