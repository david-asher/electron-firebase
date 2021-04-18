/* mainapp.js
 * Copyright (c) 2019-2021 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * High-level functions for quickly building the main application.
 * @module mainapp
 */

// electron dependencies
const { app, ipcMain, dialog } = require('electron')

// a place to keep all open windows
const windowList = []

// but this window is special
var signInWindow = null

/* local dependencies
 * We would like to reference the API as:
 *   const efb = require('../electron-firebase')
 * However we want to include mainapp.js as part of the API definition, but then 
 * mainapp.js couldn't load electron-firebase.js because it would be a circular
 * dependency. So we make this exception and load the API modules individually.
 */
const efb = {
    applib:     require('./applibrary'),
    auth:       require('./authentication'),
    file:       require('./fileutils'),
    firestore:  require('./firestore'),
    fbstorage:  require('./fbstorage'),
    local:      require('./localstorage'),
    server:     require('./webserver'),
    window:     require('./windows')
}

/*
 * Compiles information about this electron app.
 */
function getAppContext()
{
    const setContext = {
        name: app.name,
        appId: global.fbConfig.appId,
        projectId: global.fbConfig.projectId,
        productName: app.productName,
        home: app.getPath( 'home' ),
        temp: app.getPath( 'temp' ),
        data: app.getPath( 'userData' ),
        exe: app.getPath( 'exe' ),
        appData: app.getPath( 'appData' ),
        appPath: app.getAppPath(),
        locale: app.getLocale(),
        countryCode: app.getLocaleCountryCode(),
        appVersion: app.getVersion(),
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        electronVersion: process.versions.electron
    }
    global.appContext = { ...global.appContext, ...setContext } 
    return global.appContext
}

function getConfigFile( filename ) 
{
    var content = null
    const testFileName = `${process.env.INIT_CWD}/developer/${filename}.json`
    const realFileName = `${process.env.INIT_CWD}/config/${filename}.json`
    if ( efb.file.isFile( testFileName ) ) {
        content = efb.file.readJSON( testFileName )
    }
    if ( !content ) content = efb.file.readJSON( realFileName )
    // no application config? full stop
    if ( content ) return content
    console.error( "No config file: ", filename )
    process.exit(404)
}

/**
 * Must be called before other APIs. Reads the two configuration files, app-config.json and 
 * firebase-config.json, and creates a global.appContext object with various information.
 * @alias module:mainapp
 */
function setupAppConfig()
{
    try {
        // read the app configuration file
        global.appConfig = getConfigFile( "app-config" )

        // read the firebase configuration file
        global.fbConfig = getConfigFile( "firebase-config" )

        global.ContentSecurityPolicy = getConfigFile( "content-security-policy" )

        const cspEntries = []
        for (const [key, value] of Object.entries( global.ContentSecurityPolicy ) ) {
            cspEntries.push( key + " " + value.join( " " ) )
        }
        global.ContentSecurityString = cspEntries.join( ";" )

        // just initialize the appContext
        global.appContext = {}
    }
    catch (error) {
        console.error( error )
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
    global.mainWindow.send( channel, payload || {} )
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

/*
 * Shows a modal error dialog box.
 */
function catchErrorAlert( errorMessage, dialogTitle )
{
    dialog.showErrorBox( dialogTitle | "ERROR", efb.applib.stringifyJSON( errorMessage ) )
}

/**
 * Call this before the app closes to perform some app cleanup.
 * @alias module:mainapp
 */
async function closeApplication(mainWindow)
{
    try {
        if ( mainWindow ) mainWindow.webContents.session.flushStorageData()
        await efb.auth.firestore().enableNetwork()
    }
    catch (error) {
        //
    }
    app.exit(0)
}

/**
 * Handles the workflow for signing out the current user. The user will be presented with a 
 * dialog box asking them to confirm signout, and optionally to sign out of the current
 * identity provider as well as the app. Fires the user-signout event when complete.
 * @alias module:mainapp
 */
async function signoutUser() 
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

    try {
        const userInput = await dialog.showMessageBox( global.mainWindow.window(), dlgOptions )
        if ( !userInput || userInput.response != 1 ) return
        const response = efb.auth.signOutUser( global.mainWindow )
        if ( response ) {
            if ( userInput.checkboxChecked ) efb.auth.signOutProvider( provider, global.mainWindow )
            efb.applib.event.emit( "user-signout" )
        }
    }
    catch (error) {
        dialog.showErrorBox( "ERROR on showMessageBox during usersignout:", error )
    }
    // tell the login script to delete the persistent user
    signInWindow = efb.auth.startNewSignIn( true ) 
}

function getBrowserInfo()
{
    // The mainWindow browser will report context information back to Main process
    ipcMain.once( 'about-browser', (appEvent,...args) => {
        global.appContext = { ...global.appContext, ...args } 
    })
}

function removeWindowFromList( event )
{
    // look for the window that is about to be closed
    windowList.find( (element, index) => 
    {
        if ( element !== event.sender ) return false
        if ( element === global.mainWindow ) global.mainWindow = null
        windowList.splice( index, 1 )
        return true
    })
}

function openSplash()
{
    return new Promise( (resolve, reject) => {

        if ( !global.appConfig.webapp.splashPage ) return reject( "no splash page" );

        const splashURL = `${global.appConfig.webapp.hostUrl}/${global.appConfig.webapp.splashPage}`
        openSplash.window = new efb.window.openModal( splashURL )

        openSplash.window.show()
    
        // capture the BrowserWindow userAgent string
        openSplash.window.once( 'ready-to-show', () => {
            var userAgent = openSplash.window.webContents.getUserAgent()
            global.userAgent = userAgent.replace( /Electron[^\s]+\s/i, "" )
        })

        setTimeout( () => {
            resolve( openSplash.window )
        }, ( global.appConfig.webapp.splashPageTimeout || 1 ) * 1000 )
    })
}

function shutSplash()
{
    if ( !openSplash.window ) return
    openSplash.window.close()
    openSplash.window = null
}

/*
 * Handles all of the workflow to create the main application window which will be 
 * available to the app as global.mainWindow. Fires the main-window-open event
 * after the window is open and visible.
 */
async function createMainWindow( windowOptions )
{
    if ( global.mainWindow ) return
    if ( !windowOptions ) windowOptions = {}
    try {
        // options, see: https://electronjs.org/docs/api/browser-window#new-browserwindowoptions
        const webapp = global.appConfig.webapp
        const defaultOptions = {
            width:  webapp.firstWidth, 
            height: webapp.firstHeight,
            title:  "window " + windowList.length
        }
        const openOptions = { ...defaultOptions, ...windowOptions }
        const pagePath = windowOptions.open_html || "pages/index.html"
        const newPageUrl = `${webapp.hostUrl}/${pagePath}`

        // always start without showing; windowOptions maintains the caller's true intent
        openOptions.show = false

        // Keep a main process reference of the window object; if you don't, the window will
        // be closed automatically when the JavaScript object is garbage collected.
        const newWindow = new efb.window.open( newPageUrl, openOptions )
        windowList.push( newWindow )

        // The first window created will be the mainWindow which we will use for persistent storage
        // the localstorage API needs to know the window and IPC in order to communicate
        // BrowserInfo are fundamentals about the app and environment that your app should have access to
        if ( !global.mainWindow ) {
            global.mainWindow = newWindow
            global.mainIPC = ipcMain
            getBrowserInfo()
        }

        // cleanup after the window is closed
        newWindow.once( 'close', removeWindowFromList )

        // we opened the main window as show:false so that we could do some processing and 
        // make a visually clean oppening for the user, especially resizing based on the previous session
        newWindow.waitForShow()
        .then( () => {
            newWindow.resize( () => {
                if ( windowOptions.show ) newWindow.show()
                efb.applib.event.emit( "window-open", newWindow )
            })
        })

        return newWindow
    }
    catch (error) {
        console.error( error )
    }
}


/**
 * This function is called after a user login has completed, which can happen after a new login
 * workflow, or after a re-login from a previous session. Fires the user-login event when complete.
 * @param {object} user - The user object that was returned from the login workflow
 * @returns {Promise<object>} Resolves after the CloudStore updates are completed
 * @alias module:mainapp
 */
async function onUserLogin( user )
{
    try {
        await efb.firestore.initialize( user.uid, global.fbConfig.projectId )
        await efb.fbstorage.initialize()
        efb.applib.event.emit( "user-ready", user )
    }
    catch (error) {
        console.error( error )
    }
    return user
}

/*
 * Called at the end of the Firebase UI workflow for user login when the loginStart.html BrowserWindow
 * has completed the login cycle and has credentials to report back to the app. req.body will contain the 
 * new user credentials.
 */
function apiPostLoginToken( req, res, next )
{
    // response from login workflow is: 
    // { account:{}, profile:{}, providerId:string, credential:{} }

    efb.auth.signInNewUser( req.body )
    .then( (user) => {
        if ( !user ) throw ( "Login failure" )
        res.status( 200 ).send()
        onUserLogin( user, true ) // forceUpdate
    })
    .catch( (error) => {
        console.error("ERROR on signInNewUser: ", error );
        res.status( 401 ).send( "Unauthorized" )
    })
}

/*
 * Called at the start of the Firebase UI workflow to obtain the Firebase configuration from the app.
 */
function apiGetFirebaseConfig( req, res, next )
{
    // the login browser needs the list of providers to present to the user
    fbConfig.providers = appConfig.providers

    // return the firebase configuration
    res.json( global.fbConfig )
}

/*
 * The login window is initially hidden because it usually checks user persistence, logs in
 * the persistent user, then closes. There's no reason to show the window while that happens.
 */
function apiLoginReady( req, res, next ) 
{
    signInWindow.show()
    res.status( 200 ).send()
}

/**
 * Registers a function that will respond to an API request from the Browser. This will
 * set up a route with the {@link http://expressjs.com/|express} middleware in the Main node.js process. 
 * For Browser pages, the /scripts/webutils.js file contains an api() function that can be
 * used to invoke a route registered with registerAPI().
 * @param {string} method - the HTTPS method such as 'GET', 'POST', etc.
 * @param {string} urlInvocation - the localhost URL to invoke, e.g. "/api/loginready"
 * @param {function} apiRouteFunction - API request called in express style i.e. (req,res,next)
 * @alias module:mainapp
 * @see {@link http://expressjs.com/en/guide/routing.html |Routing in Express}
 */
async function registerAPI( method, urlInvocation, apiRouteFunction )
{
    global.apiRouter[ method.toLowerCase() ]( urlInvocation, apiRouteFunction  )
}

/*
 * Starts the HTTPS webserver which is user for secure communication from the BrowserWindow,
 * sets up the routes to implement the APIs for login, and configures the top-level paths
 * for serving static content. 
 */
async function startWebServices()
{
    // start the HTTPS efb.server, include routes for static content folders
    return efb.server.start( app, global.appConfig.webFolders )
    .then( (apiRouter) => 
    {
        global.apiRouter = apiRouter
        registerAPI( 'GET', global.appConfig.apis.firebaseconfig, apiGetFirebaseConfig )
        registerAPI( 'GET', global.appConfig.apis.loginready, apiLoginReady )
        registerAPI( 'POST', global.appConfig.apis.logintoken, apiPostLoginToken )
    })
    .catch( (error) => {
        throw( error )
    })
}

/**
 * This is it, the function that kicks it all off.
 * @param {object} options - May contain show, width, height, title, main_html
 * @alias module:mainapp
 */
async function startMainApp( options )
{
    // don't do this more than once
    if ( global.mainWindow ) return
   
    try {
        // get the configuration set
        getAppContext()

        // catch error messages and show to the user
        efb.applib.event.on( 'show-error', catchErrorAlert )

        // make sure efb.local and other browser caches are flushed
        app.on( 'before-quit', closeApplication )

        // the web server is used for secure communication with the BrowserWindow
        await startWebServices()

        // show the splash, which should have no code dependencies
        await openSplash()

        // firebase must be initialized before any calls can be made
        efb.auth.initializeFirebase()

        // open the first window which will be the global.main window
        await createMainWindow( options )

        // check if the user is signed in and if not, kick off the signin process
        signInWindow = await efb.auth.startNewSignIn()

        // conditions for terminating the splash page
        efb.applib.event.on( "user-ready", shutSplash )
        efb.applib.event.on( "start-new-signin", shutSplash )

        // tell anyone that cares, the main window is now open
        efb.applib.event.emit( "main-window-ready", global.mainWindow )
    }
    catch (error) {
        console.error( error )
    }
    return global.mainWindow
}

module.exports = {
    startMainApp: startMainApp,
    onUserLogin: onUserLogin,
    closeApplication: closeApplication,
    sendToBrowser: sendToBrowser,
    getFromBrowser: getFromBrowser,
    signoutUser: signoutUser,
    registerAPI: registerAPI,
    setupAppConfig: setupAppConfig,
    /**
     * Exports a node.js Event Emitter object that can be used to send and receive 
     * messages with other parts of the application.
     * @see {@link https://nodejs.org/api/events.html|Events}
     * @alias module:mainapp
     */
    event: efb.applib.event
}

