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
 * High-level functions for quickly building the main application.
 * @module electron-firebase
 */

// process.on('warning', e => console.warn(e.stack));

const { app } = require('electron')
const { mainapp } = require( '../electron-firebase' )
const { infoRequest, showFile } = require('./answerBrowser')
const { updateUserDocs } = require('./setupApp')

// one call to setup the electron-firebase framework
mainapp.setupAppConfig()

function logwrite( ...stuff )
{
//    if ( !global.appConfig.debugMode ) return
    console.log.apply( null, stuff )
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
    await updateUserDocs( user, global.appContext, global.appConfig )
    mainapp.sendToBrowser( 'app-ready' )
})

mainapp.event.once( "window-open", (window) => 
{
    // first event will be the main window
    logwrite( "EVENT window-open: ", window.getTitle() )
})

mainapp.event.once( "main-window-ready", (window) => 
{
    logwrite( "EVENT main-window-ready: ", window.getTitle() )

    // shut down the app and clean up when the main window closes
    window.on( 'close', (event) => {
        console.log( "CLOSE main-window-ready ", event.sender.getTitle() )
        mainapp.closeApplication(window)
    })

    // signout button was pressed
    mainapp.getFromBrowser( "user-signout", mainapp.signoutUser )

    // one of the information request buttons was clicked
    mainapp.getFromBrowser( 'info-request', infoRequest )

    // action request from browser
    mainapp.getFromBrowser( 'show-file', showFile )
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
            title:  "Main Window: " + global.fbConfig.projectId,
            open_html: global.appConfig.webapp.mainPage,
            show:true
        })
        // now do some other synchronous startup thing if you want to
        // otherwise wait for the "user-ready" event
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

