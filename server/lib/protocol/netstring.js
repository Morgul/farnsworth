//----------------------------------------------------------------------------------------------------------------------
// An implementation of netstring encoding/decoding using a Transform Stream.
//
// @module netstring.py
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');
var Transform = require('stream').Transform;

//----------------------------------------------------------------------------------------------------------------------

/**
 * Encodes data written to this stream as netstrings.
 *
 * This stream makes a large assumption, which will not be valid for all streams you might want to connect to this. It
 * assumes that **all chunks are discrete packets of data**, and a message will never be broken up over multiple chunks.
 * If you need to connect such a stream to this, you will need to implement some sort of buffering stream in between,
 * so that this class only receives entire messages.
 *
 * @param options The stream options.
 * @constructor
 */
function NSEncodeStream(options)
{
    options = options || {};
    options.decodeStrings = false;
    options.objectMode = true;

    Transform.call(this, options);
} // end NSEncodeStream

util.inherits(NSEncodeStream, Transform);

NSEncodeStream.prototype._transform = function(chunk, encoding, done)
{
    try
    {
        this.push(chunk.length + ":" + chunk + ",");
        done();
    }
    catch(ex)
    {
        done(ex);
    } // end try/catch
};

//----------------------------------------------------------------------------------------------------------------------

/**
 * Decodes incoming netstrings and outputs them as discrete chunks.
 *
 * This will always output an entire message as a chunk, so you can always be guaranteed that it will be outputting full
 * messages.
 *
 * @param options The stream options.
 * @constructor
 */
function NSDecodeStream(options)
{
    Transform.call(this, options);
    this.netBuf = [];
} // end NSDecodeStream

util.inherits(NSDecodeStream, Transform);

NSDecodeStream.prototype._transform = function(chunk, encoding, done)
{
    this.netBuf.push(chunk.toString(encoding));
    var buffer = this.netBuf.join("");

    while(buffer.length > 0)
    {
        // Can we attempt to parse?
        if(buffer.indexOf(':') != -1)
        {
            // Due to javascript's lack of a split limit, we do a song and dance.
            var cmps = buffer.split(':');
            var length = parseInt(cmps.shift());
            var remainder = cmps.join(':');

            // Do we have enough to try parsing?
            if(remainder.length >= length)
            {
                if(remainder[length] != ',')
                {
                    console.error('Remainder:', remainder, 'Length:', length);

                    // Error! We have an invalid netstring!
                    done(new Error("Invalid netstring."));

                    // Clear the buffer; we're hosed and can't recover.
                    this.netBuf = [];
                    break;
                } // end if

                this.push(remainder.slice(0, length));
                buffer = remainder.slice(length + 1);
            }
            else
            {
                break;
            } // end if
        }
        else
        {
            break;
        } // end if
    } // end while

    // Whatever's left in the buffer becomes our new netBuf, otherwise, netBuf is empty.
    if(buffer != '')
    {
        this.netBuf = [buffer];
    }
    else
    {
        this.netBuf = [];
    } // end if

    // For better or worse, we've finished.
    done();
}; // end _transform
//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    NSEncodeStream: NSEncodeStream,
    NSDecodeStream: NSDecodeStream
};

//----------------------------------------------------------------------------------------------------------------------