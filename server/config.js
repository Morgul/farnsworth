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

    // Put config here.

}; // end exports

//----------------------------------------------------------------------------------------------------------------------
