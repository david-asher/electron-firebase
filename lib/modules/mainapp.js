/* mainapp.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * High-level functions for quickly building the main application.
 * @module mainapp
 */

// electron dependencies
const { app, ipcMain, dialog } = require('electron')

var signInWindow = null

/* local dependencies
 * We would like to reference the API as:
 *  const efb = require('../electron-firebase')
 * However we want to include mainapp.js as part of the API definition, but then 
 * mainapp.js couldn't load electron-firebase.js because it would be a circular
 * dependency. So we make this exception and load the API modules individually.
 */
const efb = {
    applib:  require('./applibrary'),
    auth:    require('./authentication'),
    store:   require('./fbstorage'),
    file:    require('./fileutils'),
    data:    require('./firestore'),
    local:   require('./localstorage'),
    server:  require('./webserver'),
    window:  require('./windows')
}

/**
 * Must be called before other APIs. Reads the two configuration files, app-config.json and 
 * firebase-config.json, and creates a global.appContext object with various information.
 * @alias module:mainapp
 */
function setupAppConfig()
{
    const projectRoot = process.env.INIT_CWD

    function getConfigFile( filename ) 
    {
        var content = null
        const testFileName = `${projectRoot}/${filename}-test.json`
        const realFileName = `${projectRoot}/config/${filename}.json`
        if ( efb.file.isFile( testFileName ) ) {
            content = efb.file.readJSON( testFileName )
        }
        if ( !content ) content = efb.file.readJSON( realFileName )
        // no application config? full stop
        if ( content ) return content
        console.error( "No config file: ", filename )
        process.exit(404)
    }

    // read the app configuration file
    global.appConfig = getConfigFile( "app-config" )

    // read the firebase configuration file
    global.fbConfig = getConfigFile( "firebase-config" )

    global.appContext = {
        name: app.name,
        home: app.getPath( 'home' ),
        temp: app.getPath( 'temp' ),
        data: app.getPath( 'userData' ),
        exe: app.getPath( 'exe' ),
        appData: app.getPath( 'appData' ),
        appPath: app.getAppPath(),
        locale: app.getLocale(),
        appVersion: app.getVersion(),
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        electronVersion: process.versions.electron
    }
}

/**
 * Sends a message - a payload on a specific channel - to the global.mainWindow.
 * @param {string} channel - A topic which the BrowserWindow should be expecting
 * @param {string|number|object|array} payload - The message content to send on the topic
 * @see {@link https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-|BrowserWindow.webContents.send()}
 * @alias module:mainapp
 */
function sendToBrowser( channel, payload )
{
    if ( !global.mainWindow ) return
    global.mainWindow.send( channel, payload )
}

/**
 * Receives a message event from the global.mainWindow, with optional callback or Promise interface. The callback
 * or Promise will fire whenever a message event is received on the channel.
 * @param {string} channel - A topic which the BrowserWindow should be expecting
 * @param {function} [callback] - Optional callback function to receive the message event 
 * @returns {Promise<string|number|object|array>} If no callback is supplied then a Promise is returned
 * @see {@link https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-|BrowserWindow.webContents.send()}
 * @alias module:mainapp
 */
function getFromBrowser( channel, callback )
{
    return global.mainWindow.receive( channel, callback )
}

/**
 * Shows a modal error dialog box.
 * @param {string} errorMessage - Error message to show to the user
 * @param {string} [dialogTitle] - Optional dialog title, defaults to "ERROR"
 * @alias module:mainapp
 */
function catchErrorAlert( errorMessage, dialogTitle )
{
    dialog.showErrorBox( dialogTitle | "ERROR", efb.applib.stringifyJSON( errorMessage ) )
}

/**
 * Closes the main window and quits the app.
 * @alias module:mainapp
 */
function closeMainWindow()
{
    // Don't allow the app to run without the main window
    efb.applib.event.emit( "main-window-close", global.mainWindow )
    app.quit()
}

/**
 * Call this before the app closes to perform some app cleanup.
 * @alias module:mainapp
 */
function beforeCloseApplication()
{
    if ( !global.mainWindow || !global.mainWindow.webContents ) return
    if ( !global.mainWindow.webContents.session ) return
    global.mainWindow.webContents.session.flushStorageData()
}

/**
 * Handles the workflow for signing out the current user. The user will be presented with a 
 * dialog box asking them to confirm signout, and optionally to sign out of the current
 * identity provider as well as the app. Fires the user-signout event when complete.
 * @alias module:mainapp
 */
function signoutUser() 
{
    if ( !global.user ) return

    var provider = efb.auth.getProvider()
    var signoutUrl = efb.auth.getSignOutUrl( provider )
    
    var dlgOptions = {
        type: "question",
        buttons: [ "Cancel", "Sign Out" ],
        defaultId: 0, // cancel is the default action
        cancelId: 0, // hit the excape button is the same as cancel
        title: "Sign Out",
        message: "Do you want to sign out from this application?",
        noLink: true, // just buttons, not links
    }

    if ( signoutUrl ) {
        dlgOptions.checkboxLabel = "Also sign out from " + provider,
        dlgOptions.checkboxChecked = false
    }

    dialog.showMessageBox( global.mainWindow.window(), dlgOptions )
    .then( ( userInput ) => {
        if ( userInput.response != 1 ) return
        efb.auth.signOutUser( global.mainWindow )
        .then( (response) => {
            if ( userInput.checkboxChecked ) efb.auth.signOutProvider( provider, global.mainWindow )
            efb.applib.event.emit( "user-signout" )
        })
        .catch( (error) => {
            dialog.showErrorBox( "ERROR on signOutUser:", error )
        })
        .finally( (response) => {
            // no reason to keep the app open
            closeMainWindow()
        })
    })
    .catch( (error) => {
        dialog.showErrorBox( "ERROR on showMessageBox during usersignout:", error )
    })
}

/**
 * Handles all of the workflow to create the main application window which will be 
 * available to the app as global.mainWindow. Fires the main-window-open event
 * after the window is open and visible.
 * @alias module:mainapp
 */
async function createMainWindow()
{
    if ( global.mainWindow ) return

    // options, see: https://electronjs.org/docs/api/browser-window#new-browserwindowoptions
    const webapp = global.appConfig.webapp
    const openOptions = {
        show: false,
        width: webapp.firstWidth, 
        height: webapp.firstHeight,
        title: "MainWindow"
    }
    const mainPageUrl = `${webapp.hostUrl}/${webapp.main}`

    // Keep a main process reference of the window object; if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    global.mainWindow = new efb.window.open( mainPageUrl, openOptions )

    // do anything here before the main window is shown
    // the localstorage API needs to know the window and IPC in order to communicate
    efb.local.setup( global.mainWindow, ipcMain )

    // The mainWindow browser will report context information back to Main process
    ipcMain.once( 'about-browser', (appEvent,...args) => {
        evtSetAppContext.apply( this, args )
    })

    // catch error messages and show to the user
    efb.applib.event.on( 'show-error', catchErrorAlert )

    // make sure efb.local and other browser caches are flushed
    app.on( 'before-quit', beforeCloseApplication )

    // we opened the main window as show:false so that we could do some processing and 
    // make a visually clean oppening for the user, especially resizing based on the previous session
    await global.mainWindow.waitForShow()
    .then( () => {
        // resize the window from the previous session, which must be after the window is created
        // because the window bounds are remembered in the browser LocalStorage
        global.mainWindow.resize( () => {
            global.mainWindow.show()
            efb.applib.event.emit( "main-window-open", global.mainWindow )
        })
    })
}

/**
 * This function is called after a user login has completed, which can happen after a new login
 * workflow, or after a re-login from a previous session. Fires the user-login event when complete.
 * @param {object} user - The user object that was returned from the login workflow
 * @param {boolean} [bForceUpdate] - Optional, set to true to force the user's persistent profile
 * in the Firebase Cloudstore to be update with the latest identity provider information
 * @returns {Promise<object>} Resolves after the CloudStore updates are completed
 * @alias module:mainapp
 */
async function onUserLogin( user, bForceUpdate )
{
    await efb.data.setup( user, bForceUpdate )
    .then( async (stuff) => {
        global.user = user
        efb.applib.event.emit( "user-login", user )
    })
    .catch( (error) => {
        console.error( "ERROR at onUserLogin, ", error )
    })
    return user
}

/**
 * Initiates the workflow to sign in a user, first checking if there is a persistent session and if not, 
 * then starting the UI to log in.
 * @returns {Promise} Promise is resolved when the user login is complete
 * @alias module:mainapp
 */
async function signInUser()
{
    efb.auth.startNewSignIn()
    .then( async (user) => {
        if ( !user ) throw( "NO USER" )
        return onUserLogin( user, true ) // forceUpdate
    })
    .catch( (error) => {
        // may not be a real error, but we didn't get an existing user, so start the login workflow
        dialog.showErrorBox( "There was a failure in the authentication process: ", error )
    })

/*
    if ( global.user ) return
    return efb.auth.signInSavedUser()
    .then( async (user) => {
        if ( !user ) throw( "NO USER" )
        return onUserLogin( user, true ) // forceUpdate
    })
    .catch( (error) => {
        // may not be a real error, but we didn't get an existing user, so start the login workflow
        efb.auth.startNewSignIn()
    })
*/
}

/**
 * Called at the end of the Firebase UI workflow for user login when the loginstart.html BrowserWindow
 * has completed the login cycle and has credentials to report back to the app. req.body will contain the 
 * new user credentials.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 * @alias module:mainapp
 */
function apiPostLoginToken( req, res, next )
{
    // response from login workflow is: 
    // { account:{}, profile:{}, providerId:string, credential:{} }

console.log( "apiPostLoginToken: ", req.body )
// signInWindow.close()

// res.status( 200 ).send()

    efb.auth.signInNewUser( req.body )
    .then( (user) => {
        if ( !user ) throw ( "Login failure" )
        res.status( 200 ).send()
        onUserLogin( user, true ) // forceUpdate
    })

    .catch( (error) => {
        console.error("ERROR on signInNewUser: ", error );
////        res.status( 401 ).send( "Unauthorized" )
    })

}


function apiPostLoginSuccess( req, res, next )
{
console.log( "apiPostLoginSuccess req: ", req.body )
console.log( "apiPostLoginSuccess res: ", res.body )

 res.status( 200 ).send()

}

function apiOauthSignInSuccess( req, res, next )
{
console.log( "apiOauthSignInSuccess req: ", req.body )
console.log( "apiOauthSignInSuccess res: ", res.body )

 res.status( 200 ).send()

}

/**
 * Called at the start of the Firebase UI workflow to obtain the Firebase configuration from the app.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 * @alias module:mainapp
 */
function apiGetAppConfig( req, res, next )
{
    // the login browser needs the list of providers to present to the user
    fbConfig.providers = appConfig.providers

////    fbConfig.persistentUser

    // return the firebase configuration
    res.json( global.fbConfig )
}

/**
 * When the main BrowserWindow starts it will report context information. This function will 
 * merge that information into the global.appContext.
 * @param {object} browserInfo 
 * @alias module:mainapp
 */
function evtSetAppContext( browserInfo )
{
    // fundamentals about the app and environment that your app should have access to
    global.appContext = { ...global.appContext, ...browserInfo } 
    efb.applib.event.emit( "app-context", global.appContext )
}

/**
 * Starts the HTTPS webserver which is user for secure communication from the BrowserWindow,
 * sets up the routes to implement the APIs for login, and configures the top-level paths
 * for serving static content. 
 * @alias module:mainapp
 */
async function startWebServices()
{
    // start the HTTPS efb.server, include routes for static content folders
    return efb.server.start( app, global.appConfig.webapp.staticContent )
    .then( (router) => 
    {
        // keep the router object in case other routes need to be established
        global.router = router

        // API /appconfig - the browser asks for the app config data set
        router.get( `/${global.appConfig.apis.config}`, apiGetAppConfig )
    
        // API /logintoken - the browser sends back credentials after a successful login
        router.post( `/${global.appConfig.apis.token}`, apiPostLoginToken )

        router.post( `/${global.appConfig.apis.success}`, apiPostLoginSuccess )

        // API /logintoken - the browser sends back credentials after a successful login
        router.post( `/${global.appConfig.apis.signin}`, apiOauthSignInSuccess )

    })
    .catch( (error) => {
        throw( error )
    })
}

/**
 * This is it, the function that kicks it all off.
 * @alias module:mainapp
 */
function startMainApp()
{
    // firebase must be initialized before any calls can be made
    efb.auth.initializeFirebase()

    // the web server is used for secure communication with the BrowserWindow
    startWebServices()
    .then( () => {
        return createMainWindow()
    })
    .then( () => {
//////        signInUser()
        signInWindow = efb.auth.startNewSignIn()
    })
    .catch( (error) => {
        throw( error )
    })
}

module.exports = {
    startMainApp: startMainApp,
    startWebServices: startWebServices,
    createMainWindow: createMainWindow,
    signInUser: signInUser,
    onUserLogin: onUserLogin,
    beforeCloseApplication: beforeCloseApplication,
    closeMainWindow: closeMainWindow,
    sendToBrowser: sendToBrowser,
    getFromBrowser: getFromBrowser,
    signoutUser: signoutUser,
    apiGetAppConfig: apiGetAppConfig,
    apiPostLoginToken: apiPostLoginToken,
    evtSetAppContext: evtSetAppContext,
    setupAppConfig: setupAppConfig,
    catchErrorAlert: catchErrorAlert,
    /**
     * Exports a node.js Event Emitter object that can be used to send and receive 
     * messages with other parts of the application.
     * @see {@link https://nodejs.org/api/events.html|Events}
     * @alias module:mainapp
     */
    event: efb.applib.event
}

