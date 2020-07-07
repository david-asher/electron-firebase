/* main.js
 * electron-firebase
 * This is a quickstart template for building Firebase authentication workflow into an electron app
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 * 
 * Log output will show DeprecationWarning: grpc.load blah blah
 * which is a know bug: https://github.com/googleapis/nodejs-vision/issues/120 
 * and here: https://github.com/firebase/firebase-js-sdk/issues/1112 
 */
'use strict';

/**
 * Testing for all of the electron-firebase modules.
 */

process.on('warning', e => console.warn(e.stack));

const { app } = require('electron')
const { mainapp } = require( '../electron-firebase' )

// console logging is not strictly synchronous, so for testing we force log and error to block

const nodeFS = require('fs')
const nodeUtil = require('util')

var lastTime = Date.now()

console.log = (...args) => {
    const isNow = Date.now()
    const delta = ( "   " + ( isNow - lastTime ) ).slice(-4)
    nodeFS.writeSync( process.stdout.fd, delta + " -- " + nodeUtil.format.apply(null,args) + "\n" )
    lastTime = isNow
}

console.error = (...args) => {
    const isNow = Date.now()
    const delta = ( "   " + ( isNow - lastTime ) ).slice(-4)
    nodeFS.writeSync( process.stderr.fd, delta + " xx " + nodeUtil.format.apply(null,args) + "\n" )
    lastTime = isNow
}

global.__TESTMODE__ = true
global.testDocPath = "./tests/generated.json"

// catch everything just in case

process.on( 'unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
    // application specific logging, throwing an error, or other logic here
})

// run the tests after both the user is ready and main window is open
var bIsWindowOpen = false
var bIsUserReady = false

// one call to setup the electron-firebase framework
mainapp.setupAppConfig()

// inject the tests folder into the webpage static content set
global.appConfig.webFolders.push( "tests" )

function logwrite( ...stuff )
{
//    if ( !global.appConfig.debugMode ) return
    console.log.apply( null, stuff )
}

// readFile and readJSON are defined here, even though there is a fileutils module,
// to eliminate that dependency

global.readFile = function( sourceFilename )
{
    try {
        return nodeFS.readFileSync( sourceFilename ).toString()
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

async function testModule( moduleName, withOption = "" )
{
    // the process for running one module through a test
    console.log( `++ ++ ++ ++ ++ ++ ++ ${moduleName}.${withOption}` )
    const testModule = require( `./test_${moduleName}` )
    await testModule.testall( withOption )
    console.log( "-- -- -- -- -- -- -- -- -- -- -- -- ")
}

async function runTests()
{
    // spin through all of the modules
    await testModule( "applibrary" )
    await testModule( "fileutils" )
    await testModule( "localstorage" )
    await testModule( "firestore", "doc" )
    await testModule( "firestore", "app" )
    await testModule( "firestore", "public" )
    await testModule( "fbstorage", "file" )
    await testModule( "fbstorage", "app" )
    await testModule( "fbstorage", "public" )

    // done!
    app.exit(0)
}


// electron-firebase framework event handling

mainapp.event.once( "user-login", (user) => 
{
    // this event will trigger on sign-in, not every time the app runs with cached credentials
    logwrite( "EVENT user-login: ", user.displayName )
})

mainapp.event.once( "user-ready", async ( user ) => 
{
    logwrite( "EVENT user-ready: ", user.displayName )
    mainapp.sendToBrowser( 'app-ready' )
    if ( bIsWindowOpen ) runTests()
    bIsUserReady = true
})

mainapp.event.once( "window-open", (window) => 
{
    // first event will be the main window
    logwrite( "EVENT window-open: ", window.getTitle() )
    if ( bIsUserReady ) runTests()
    bIsWindowOpen = true
})

mainapp.event.once( "main-window-ready", (window) => 
{
    logwrite( "EVENT main-window-ready: ", window.getTitle() )

//    mainapp.getFromBrowser( "user-signout", mainapp.signoutUser )

})

mainapp.event.once( "main-window-close", (window) => 
{
    // use this to clean up things
})

// electron app event handling

// Quit when all windows are closed.
// see: https://www.electronjs.org/docs/api/app#event-window-all-closed
app.on( 'window-all-closed', () => 
{
    logwrite( "EVENT app window-all-closed" )
    mainapp.closeApplication()
})

// This function will be called when Electron has finished initialization and is ready to create 
// browser windows. Some APIs can only be used after this event occurs. launchInfo is macOS specific.
// see: https://www.electronjs.org/docs/api/app#event-ready
app.on( 'ready', async (launchInfo) => 
{
    logwrite( "EVENT app ready" )
    global.launchInfo = launchInfo | {}
    try {
        await mainapp.startMainApp({
            title:  "TEST Window: " + global.fbConfig.projectId,
            open_html: "tests/testpage_local.html",
            show: true, ///////////////////////////////////////// false,
            movable: false,
            resizable: false
        })
    }
    catch (error) {
        console.error( error )
    }
})

// see: https://electronjs.org/docs/api/app#event-activate-macos
// macOS specific - Emitted when the application is activated. Various actions can trigger this 
// event, such as launching the application for the first time, attempting to re-launch the 
// application when it's already running, or clicking on the application's dock or taskbar icon.
app.on( 'activate', (appEvent,hasVisibleWindows) => 
{
    logwrite( "EVENT app activate " )
    // do whatever
})

