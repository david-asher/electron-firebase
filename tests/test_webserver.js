// test_template.js
'use strict';

const assert = require('assert').strict
const { app } = require('electron')
const webRequest = require('request')

// module under test:
const { applib, server } = require('../electron-firebase')

// specimens
const jsonDoc = global.readFile( global.testDocPath )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]

var baseOptions = { 
    rejectUnauthorized: false,
    headers: {
        referer: global.appConfig.webapp.hostUrl
    }
}

const newDocOptions = { ...baseOptions, ...{
    method: 'POST',
    url: `${global.appConfig.webapp.hostUrl}/api/test/newdoc`,
    json: true,
    body: testObj
} }

const oldDocOptions = { ...baseOptions, ...{
    method: 'GET',
    url: `${global.appConfig.webapp.hostUrl}/api/test/olddoc`,
    json: true
} }

function _catchHandler( error )
{
    return Promise.reject( error )
}

async function startWebserver()
{
    return server.start( app, [ "pages", "node_modules", "lib", "css", "fonts" ] )
}

async function testall()
{
    var newDoc, router

    // the webserver needs this to find the cert files for TLS
    global.appContext = {
        appPath: __dirname.split("/").slice(0,-1).join("/")
    }
    // console.log( "global.appConfig = ", global.appConfig )

    // set up a route for GET and a route for POST, then test if a GET retreives
    // the same content that was sent with a POST
    console.log( ">> start" )
    await startWebserver()
    .then( async (appServer) => {
        router = appServer

        router.get( "/api/test/olddoc", (req, res, next ) => 
        {
            res.json( newDoc )
        })
    
        router.post( "/api/test/newdoc", (req, res, next ) => 
        {
            newDoc = req.body
            res.status( 200 ).send()
        })
    
    })
    .catch( _catchHandler )

    console.log( ">> POST" )
    await applib.request( newDocOptions )
    .then( async ( response ) => {
        assert.equal( response.statusCode, 200 )
    })
    .catch( _catchHandler )

    console.log( ">> GET" )
    await applib.request( oldDocOptions )
    .then( async ( response ) => {
        assert.equal( response.statusCode, 200 )
        assert.deepEqual( response.body, testObj )
    })
    .catch( _catchHandler )
    
    return true
}

module.exports = {
    target: () => { return server.modulename() },
    testall: testall
}
