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

global.__TESTMODE__ = true
global.testDocPath = "./tests/generated.json"

const fs = require('fs')

const { app } = require('electron')
const { mainapp } = require( '../electron-firebase' )

// run the tests after both the user is ready and main window is open
var bIsWindowOpen = false
var bIsUserReady = false

// one call to setup the electron-firebase framework
mainapp.setupAppConfig()

// inject the tests folder into the webpage static content set
global.appConfig.webapp.staticContent.push( "tests" )

function logwrite( ...stuff )
{
//    if ( !global.appConfig.debugMode ) return
    console.log.apply( null, stuff )
}

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

async function testModule( moduleName, index )
{
    const module = require( `./${moduleName}` )
    console.log( `${index}: ${module.target()}` )
    try {
        await module.testall()
    }
    catch (error) {
        console.error( error )
    }
    console.log( "_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _")
}

async function runTests()
{
    process.on( 'unhandledRejection', (reason, p) => {
        logwrite('Unhandled Rejection at: Promise', p, 'reason:', reason)
        // application specific logging, throwing an error, or other logic here
    })

    await testModule( "test_webserver", 0 )

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
            show:true
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

