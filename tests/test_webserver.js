// test_template.js
'use strict';

const assert = require('assert').strict

// module under test:
const { applib, server } = require('../electron-firebase')

// specimens
const jsonDoc = global.readFile( global.testDocPath )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]

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

async function testall()
{
    var newDoc

    // set up a route for GET and a route for POST, then test if a GET retreives
    // the same content that was sent with a POST

    console.log( ">> start: ", !!global.router )

    // client will POST the sample doc and we save it here
    global.router.post( "/api/test/newdoc", (req, res, next ) => 
    {
        newDoc = req.body
        res.status( 200 ).send()
    })

    // client will GET the sample doc after it's saved
    global.router.get( "/api/test/olddoc", (req, res, next ) => 
    {
        res.json( newDoc )
    })
    
    try {
        const postResponse = await applib.request( newDocOptions )
        assert.equal( postResponse.status, 200 )

        const getResponse = await applib.request( oldDocOptions )
        assert.equal( getResponse.status, 200 )
        assert.deepEqual( getResponse.data, testObj )
    }
    catch (error) {
        console.error( "POST ERROR: ", error )
        return false
    }
    return true
}

module.exports = {
    target: () => { return server.modulename() },
    testall: testall
}
