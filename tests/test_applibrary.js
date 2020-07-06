// test_applibrary.js
'use strict';

const assert = require('assert').strict

// module under test:
const { applib } = require('../electron-firebase');

// specimens
const jsonDoc = global.readFile( global.testDocPath )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]

var errorCount = 0

var baseOptions = { 
    https: {
        rejectUnauthorized: false,
    },
    headers: {
        referer: global.appConfig.webapp.hostUrl
    }
}

const newDocOptions = { ...baseOptions, ...{
    method: 'POST',
    url: `${global.appConfig.webapp.hostUrl}/api/test/newdoc`,
    data: testObj
} }

const oldDocOptions = { ...baseOptions, ...{
    method: 'GET',
    url: `${global.appConfig.webapp.hostUrl}/api/test/olddoc`
} }

async function testallFunctions()
{
    var newDoc

    // isJSON( s ) 
    console.log( ">> isJSON" )
    assert( applib.isJSON( jsonDoc ) )                // valid JSON
    assert( !applib.isJSON( testObj ) )               // object
    assert( !applib.isJSON( testObj._id ) )           // string
    assert( !applib.isJSON( testObj.latitude ) )      // number
    assert( !applib.isJSON( testObj.tags ) )          // array

    // isObject( obj )
    console.log( ">> isObject" )
    assert( applib.isObject( testObj ) )              // object
    assert( applib.isObject( testObj.tags ) )         // array
    assert( !applib.isObject( testObj._id ) )         // string
    assert( !applib.isObject( testObj.latitude ) )    // number

    // parseJSON( inputSerialized, optionalErrorCode )
    // note: correct testing of optionalErrorCode yields a process exit
    console.log( ">> parseJSON" )
    assert.deepEqual( testDoc, applib.parseJSON( jsonDoc ) )

    // compactJSON( inputObject, optionalErrorCode )
    console.log( ">> compactJSON" )
    assert.deepEqual( testDoc, applib.parseJSON( applib.compactJSON( testDoc ) ) )

    // stringifyJSON( inputObject, optionalErrorCode )
    console.log( ">> stringifyJSON" )
    assert.deepEqual( testDoc, applib.parseJSON( applib.stringifyJSON( testDoc ) ) )

    // mergeObjects( ...objects ) 
    console.log( ">> mergeObjects" )
    const merged = applib.mergeObjects( testDoc[0], testDoc[1], testDoc[2] )
    assert.deepEqual( merged.tags, [].concat( testDoc[0].tags, testDoc[1].tags, testDoc[2].tags ) )
    assert.deepEqual( merged.friends, [].concat( testDoc[0].friends, testDoc[1].friends, testDoc[2].friends ) )

    // set up a route for GET and a route for POST, then test if a GET retreives
    // the same content that was sent with a POST
    global.router.post( "/api/test/newdoc", (req, res, next ) => 
    {
        newDoc = req.body
        res.status( 200 ).send()
    })
    global.router.get( "/api/test/olddoc", (req, res, next ) => 
    {
        res.json( newDoc )
    })

    console.log( ">> request post" )
    const postResponse = await applib.request( newDocOptions )
    assert.equal( postResponse.status, 200 )

    console.log( ">> request get" )
    const getResponse = await applib.request( oldDocOptions )
    assert.equal( getResponse.status, 200 )
    assert.deepEqual( getResponse.data, testObj )

    return true
}

async function testall()
{
    try {
        await testallFunctions()
    }
    catch (error) {
        errorCount++
        console.error( error )
    }
    return errorCount
}

module.exports = {
    testall: testall
}
