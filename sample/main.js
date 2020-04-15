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

const { infoRequest } = require('./answerBrowser')

// one call to setup the electron-firebase framework
mainapp.setupAppConfig()

// electron-firebase framework event handling

mainapp.event.once( "app-context", (appContext) => 
{
    console.log( "EVENT app-context: ", appContext.name )
})

mainapp.event.once( "user-login", (user) => 
{
    console.log( "EVENT user-login: ", user.displayName )
})

mainapp.event.once( "main-window-close", (window) => 
{
    console.log( "EVENT main-window-close: ", window.getTitle() )
})

mainapp.event.once( "main-window-open", (window) => 
{
    console.log( "EVENT main-window-open: ", window.getTitle() )

    // signout button was pressed
    mainapp.getFromBrowser( "user-signout", mainapp.signoutUser )

    // one of the information request buttons was clicked
    mainapp.getFromBrowser( 'info-request', (request, parameter) => {
        infoRequest( request, parameter )
        .then( (content) => {
            mainapp.sendToBrowser( 'info-request', content )
        })
        .catch( (error) => {
            console.error( "info-request: ", error )
        })
    })    
})

// electron app event handling

// see: https://www.electronjs.org/docs/api/app#event-window-all-closed
// Quit when all windows are closed.
app.on( 'window-all-closed', () => 
{
    mainapp.closeMainWindow()
})

// see: https://www.electronjs.org/docs/api/app#event-ready
// This method will be called when Electron has finished initialization and is ready to create 
// browser windows. Some APIs can only be used after this event occurs.
app.on( 'ready', (launchInfo) => 
{
    // launchInfo is macOS specific
    mainapp.startMainApp()
})

// see: https://electronjs.org/docs/api/app#event-activate-macos
// macOS specific - Emitted when the application is activated. Various actions can trigger this 
// event, such as launching the application for the first time, attempting to re-launch the 
// application when it's already running, or clicking on the application's dock or taskbar icon.
app.on( 'activate', (appEvent,hasVisibleWindows) => 
{
    console.log( "EVENT app activate: " )
    // do whatever
})

