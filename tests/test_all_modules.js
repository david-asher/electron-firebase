/*
 * test_apputils.js
 * Unit-test automation for electron-firebase
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

var  moduleList = [
//    'test_applibrary',
//    'test_fileutils',
//    'test_firestore',
//    'test_fbstorage',
//    'test_windows',
//    'test_localstorage',
    'test_webserver'
]

/*
 * global.__TESTMODE__ is used to configure each JS module to export modulename() 
 * and probe() functions. Otherwise in normal use these won't be exported.
 * 
 * global.testDocPath is a file with a bunch of random JSON stuff.
 * thanks to https://www.json-generator.com/
 * 
 * The readFile() and readJSON() files are included here as very simple test
 * functions - if they throw an error it's okay, it's better to be sure that
 * the test are working.
 */

global.__TESTMODE__ = true
global.testDocPath = "./tests/generated.json"

const fs = require('fs')

/* if you want to catch unhandled rejections:
process.on( 'unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
    // application specific logging, throwing an error, or other logic here
})
*/

global.readFile = function( sourceFilename )
{
    try {
        return fs.readFileSync( sourceFilename ).toString()
    }
    catch (error) {
        return null
    }
}

global.readJSON = function( sourceFilename )
{
    try {
        return JSON.parse( global.readFile( sourceFilename ) )
    }
    catch (error) {
        return null
    }
}

// const { auth, data } = require('../lib/electron-firebase')
const efb = require('../electron-firebase')

function catchError( error )
{
    throw( error )
}

async function setupUser( user )
{
    global.user = user
    return await efb.data.setup( user )
    .then( async (rootDoc) => {
        global.rootDoc = rootDoc
        return await Promise.resolve( rootDoc )
    })
    .catch( catchError )
}

async function loginAndSetup()
{
    efb.auth.initializeFirebase()

    return await efb.auth.startNewSignIn()  //  signInSavedUser()
    .then( async (user) => {
        return await setupUser( user )
    })
    .catch( catchError )
}

async function testModule( moduleName, index )
{
    const module = require( `./${moduleName}` )
    console.log( `${index}: ${module.target()}` )
    await module.testall().catch( catchError )
    console.log( "_ _ _ _ _ _ _ _")
}

async function testList()
{
    for ( var moduleIndex in moduleList ) {
        await testModule( moduleList[moduleIndex], moduleIndex )
    }
}

async function runAllTests()
{
    console.log( "* * * Testing all modules * * *" )

    // the app config must be loaded since it's used by a lot of functions
    global.appConfig = global.readJSON( 'app-config-test.json' )
    if ( !global.appConfig ) global.appConfig = global.readJSON( 'config/app-config.json' )
    global.fbConfig = global.readJSON( 'firebase-config-test.json' )
    if ( !global.fbConfig ) global.fbConfig = global.readJSON( 'config/firebase-config.json' )

    // console.log( "global.appConfig = ", global.appConfig )
    // console.log( "global.fbConfig = ", global.fbConfig )

    // database and storage unit tests require a logged in user
    await loginAndSetup()
    .then( testList )
    .catch( catchError )

    console.log( "ALL TESTS COMPLETED SUCCESSFULLY")
    process.exit(0)
}

runAllTests()
