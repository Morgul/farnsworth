//----------------------------------------------------------------------------------------------------------------------
// A simple configuration file. To add a configuration key, do so in the module.exports object.
//
// @module config.js
//----------------------------------------------------------------------------------------------------------------------

function get(key, defaultValue)
{
    if(key in module.exports)
    {
        return module.exports[key];
    } // end if

    return defaultValue;
} // end get

//----------------------------------------------------------------------------------------------------------------------

module.exports = {

    get: get,

    // The ID of this farnsworth
    farnsworthID: 12,

    // Port to listen for connections on
    listenPort: 1313

}; // end exports

//----------------------------------------------------------------------------------------------------------------------
