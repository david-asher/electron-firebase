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
const { mainapp, fbstorage } = require( '../electron-firebase' )
const { infoRequest, showFile } = require('./answerBrowser')
const { updateUserDocs } = require('./setupApp')

// one call to setup the electron-firebase framework
mainapp.setupAppConfig()

// electron-firebase framework event handling

mainapp.event.once( "user-login", (user) => 
{
    // this event will trigger on sign-in, not every time the app runs with cached credentials
    console.log( "EVENT user-login: ", user.displayName )
})

mainapp.event.once( "main-window-close", (window) => 
{
    // use this to clean up things
    console.log( "EVENT main-window-close: ", window.getTitle() )
})

mainapp.event.once( "user-ready", ( user ) => 
{
    console.log( "EVENT user-ready: ", user.displayName )
    updateUserDocs( user, global.appContext, global.appConfig )
    mainapp.sendToBrowser( 'user-ready' )
/*****
    fbstorage.file.list("info")
    .then( (response) => {
        console.log( "info: ", response )
    })
    .catch( (error) => {
        console.error( "info ERROR: ", error )
    })
    fbstorage.file.list("account")
    .then( (response) => {
        console.log( "account: ", response )
    })
    .catch( (error) => {
        console.error( "account ERROR: ", error )
    })
    */
})

mainapp.event.once( "main-window-open", (window) => 
{
    console.log( "EVENT main-window-open: ", window.getTitle() )

    // signout button was pressed
    mainapp.getFromBrowser( "user-signout", mainapp.signoutUser )

    // one of the information request buttons was clicked
    mainapp.getFromBrowser( 'info-request', infoRequest )

    // action request from browser
    mainapp.getFromBrowser( 'show-file', showFile )
})

// electron app event handling

// see: https://www.electronjs.org/docs/api/app#event-window-all-closed
// Quit when all windows are closed.
app.on( 'window-all-closed', () => 
{
    console.log( "EVENT app window-all-closed" )
    mainapp.closeMainWindow()
})

// see: https://www.electronjs.org/docs/api/app#event-ready
// This method will be called when Electron has finished initialization and is ready to create 
// browser windows. Some APIs can only be used after this event occurs.
app.on( 'ready', (launchInfo) => 
{
    console.log( "EVENT app ready" )
    // launchInfo is macOS specific
    // can't get the appContext until electron declares the app is ready
    try {
        mainapp.getAppContext()
        mainapp.startMainApp()
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
    console.log( "EVENT app activate: " )
    // do whatever
})

