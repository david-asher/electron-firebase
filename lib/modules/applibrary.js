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
const urlFormat = require('url').format
const https = require('https')
const webRequest = require('axios')

// when making an https request to localhost (like for testing), disable self-service cert rejection
const httpsAcceptAgent = new https.Agent({ rejectUnauthorized: false })

/**
 * Tests whether the input looks like a JSON string.
 * @param {*} s - a parameter to be tested
 * @returns {boolean} True if the input is likely a JSON string
 * @alias module:applib
 */
function isJSON( s ) 
{
    return ( typeof s == 'string' ) && ( s.charAt(0) == '{' || s.charAt(0) == '[' )
}

/**
 * Tests whether the input is an object.
 * @param {*} obj - a parameter to be tested
 * @returns {boolean} True if the input is an object
 * @alias module:applib
 */
function isObject( obj )
{
    return ( typeof obj == 'object' && obj !== null )
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
    if ( !isJSON( inputSerialized ) ) {
        return inputSerialized
    }
    try {
        if( inputSerialized.content ) inputSerialized = inputSerialized.content
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
    // 4 is the number of spaces for indenting each newline level
    return _formatJSON( inputObject, 4 )
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
                prev[key] = pVal.concat(...oVal)
                return
            }
            if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeObjects(pVal, oVal)
                return
            }
            prev[key] = oVal
        });
        return prev
    }, {} )
}

/**
 * A promise interface for the npm request HTTP client.
 * @param {object} options - Parameters that define this request
 * @returns {Promise} Promise object represents the HTTP response
 * @alias module:applib
 * @see {@link https://www.npmjs.com/package/axios}
 * @see {@link https://nodejs.org/api/https.html#https_https_request_options_callback}
 * @see {@link https://nodejs.org/api/http.html#http_class_http_serverresponse}
 */
function request( options )
{
    // originally designed based on request, now deprecated
    // convert request options format to axios
    const reqOptions = { ...options }
    if ( isObject( options.url ) ) reqOptions.url = urlFormat( options.url )
    if ( options.qs && !options.params ) reqOptions.params = options.qs
    if ( options.body && !options.data ) reqOptions.data = options.body

    // disable self-signed certificate rejection only for a localhost request
    if ( 0 == reqOptions.url.indexOf( "https://localhost" )) reqOptions.httpsAgent = httpsAcceptAgent

    // axios is already a promise, returning the HTTP response object
    return  webRequest( reqOptions )
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
