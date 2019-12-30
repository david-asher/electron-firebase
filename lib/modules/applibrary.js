/* applibrary.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Collection of utilities for JSON, objects, events, web request.
 * @module applib
 */

// this is the global event emitted that all modules and the main app should share
const eventsHandler = require('events')
const eventEmitter = new eventsHandler.EventEmitter()

// applib exports the web request function as a promise
const webRequest = require('request')
const jsonSpace = 4

/**
 * Tests whether the input looks like a JSON string.
 * @param {*} s - a parameter to be tested
 * @returns {boolean} True if the input is likely a JSON string
 * @alias module:applib
 */
function isJSON( s ) 
{
    return ( typeof s == 'string' ) && ( s.charAt(0) == '{' || s.charAt(0) == '[' );
}

/**
 * Tests whether the input is an object.
 * @param {*} obj - a parameter to be tested
 * @returns {boolean} True if the input is an object
 * @alias module:applib
 */
function isObject( obj )
{
    return obj && typeof obj == 'object'
}

/**
 * Converts a JSON string to an object, handling errors so this won't throw an exception.
 * @param {string} inputSerialized - A JSON string
 * @return {object} Null if there is an error, else a valid object
 * @alias module:applib
 */
function parseJSON( inputSerialized )
{
    var outputObject = null
    if ( inputSerialized == null ) return null
    if( inputSerialized.content ) inputSerialized = inputSerialized.content
    if ( !isJSON( inputSerialized ) ) {
        console.error( "parseJSON error, input is not JSON: ", inputSerialized )
        return outputObject
    }
    try {
        // accept an object (for faster pass-by-reference) and assume .content property
        outputObject = JSON.parse( inputSerialized )
    }
    catch (error) {
        console.error( "parseJSON error: ", error )
        // else nothing, leave outputObject as null
    }
    return outputObject
}

function _formatJSON( inputObject, jsonSpaceString )
{
    var outputString = null
    if ( inputObject == null ) return outputString
    if ( inputObject.content ) inputObject = inputObject.content
    if ( typeof inputObject !== 'object' ) {
        console.error( "ERROR on stringifyJSON: ", inputObject )
    }
    try {
        // accept an object (for faster pass-by-reference) and assume .content property
        outputString = JSON.stringify( inputObject, null, jsonSpaceString )
    }
    catch (error) {
        console.error( "stringifyJSON error: ", error )
        // else nothing, leave outputString as null
    }
    return outputString
}

/**
 * Converts an object into a JSON string with space/newline formatting, handling errors so it won't throw an exception.
 * @param {object} inputObject  - a valid JavaScript object
 * @returns {string} Null if there is an error, else a JSON string
 * @alias module:applib
 */
function stringifyJSON( inputObject )
{
    return _formatJSON( inputObject, jsonSpace )
}

/**
 * Same as stringifyJSON except the result is compact without spaces and newlines.
 * @param {object} inputObject  - a valid JavaScript object
 * @returns {string} Null if there is an error, else a JSON string
 * @alias module:applib
 */
function compactJSON( inputObject )
{
    return _formatJSON( inputObject, null )
}

/**
 * Performs a deep merge of the input objects.
 * @param  {...any} objects - A parameter set (comma-separated) of objects
 * @returns {object} A JavaScript object
 * @alias module:applib
 */
function mergeObjects( ...objects ) 
// from: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
{  
    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];
            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = pVal.concat(...oVal);
                return
            }
            if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeObjects(pVal, oVal);
                return
            }
            prev[key] = oVal;
        });
        return prev;
    }, {} );
}

/**
 * A promise interface for the npm request HTTP client.
 * @param {object} options - Parameters that define this request
 * @returns {Promise} Promise object represents the HTTP response
 * @alias module:applib
 * @see {@link https://github.com/request/request|request}
 */
function request( options )
{
    // setup GCP API interface debugging
    webRequest.debug = global.appConfig.debugMode

    // convert request from callback to promise
    return new Promise( ( resolve, reject ) =>
    {
        webRequest( options, ( error, response) => {
            if ( error ) {
                console.error( "ERROR on request: ", error, options )
                return reject( error )
            }
            resolve( response )
        })
    })
}

module.exports = {
    isJSON: isJSON,
    isObject: isObject,
    parseJSON: parseJSON,
    compactJSON: compactJSON,
    stringifyJSON: stringifyJSON,
    mergeObjects: mergeObjects,
    event: eventEmitter,
    request: request
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}