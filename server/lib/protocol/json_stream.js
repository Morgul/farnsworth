//----------------------------------------------------------------------------------------------------------------------
// A simple json decoding stream implementation
//
// @module json_stream
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');
var Transform = require('stream').Transform;

//----------------------------------------------------------------------------------------------------------------------

function JSONDecodeStream(options)
{
    options = options || {};
    options.decodeStrings = false;
    options.objectMode = true;

    Transform.call(this, options);
} // end JSONDecodeStream

util.inherits(JSONDecodeStream, Transform);

JSONDecodeStream.prototype._transform = function(chunk, encoding, done)
{
    try
    {
        this.push(JSON.parse(chunk));
        done();
    }
    catch(ex)
    {
        done(ex);
    } // end try/catch
}; // end JSONDecodeStream

//----------------------------------------------------------------------------------------------------------------------

module.exports = JSONDecodeStream;

//----------------------------------------------------------------------------------------------------------------------