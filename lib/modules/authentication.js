/* authentication.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Authentication workflow for Google Firebase. 
 * @see {@link https://github.com/firebase/FirebaseUI-Web|FirebaseUI for Web}
 * @module auth
 */

const firebase = require('firebase')
const urlParser = require('url').parse
const urlFormat = require('url').format
const applib = require( './applibrary' )
const window = require( './windows' )

/**
 * Must be called before any operations on Firebase API calls.
 * @alias module:auth
 */
function initializeFirebase()
{
    // we must do this before using firebase
    firebase.initializeApp( global.fbConfig );
}

/**
 * Firestore is a Google NoSQL datastore. This function returns a reference that can be used with the Firestore API.
 * @returns {Firestore} An interface to Firestore
 * @alias module:auth
 * @see {@link https://firebase.google.com/docs/firestore/|Firestore}
 */
function firestore()
{
    return firebase.firestore()
}

/**
 * Return the unique path prefix for a user.
 * @returns {string} A path string
 * @alias module:auth
 */
function userPath()
{
    return `users/${firebase.auth().currentUser.uid}`
}

/**
 * Executes an API call to Google Cloud, taking care of user authentication.
 * @param requestOptions - A set of option parameters for the API request
 * @param {string|object} requestOptions.url - HTTP(S) endpoint to call, string or object in the format of url.parse()
 * @param {string} requestOptions.method - HTTP verb, e.g. GET, POST, etc.
 * @param {object} requestOptions.headers - An object with any additional request headers 
 * @returns {Promise} Promise object represents the payload response of the API call (string|object|buffer)
 * @alias module:auth
 * @see {@link https://github.com/request/request#requestoptions-callback|Request Options}
 */
function gcpApi( requestOptions )
{
    return new Promise( (resolve, reject) => {
    
        // make a copy so that we don't munge the original request
        const gcOptions = { ...requestOptions }
    
        // fix the ?feature? where request won't work unless both host and hostname are set
        // where either uri or url can be set, as either strings or objects
        // could we have made this any more complicated?
        if ( !gcOptions.url && gcOptions.uri ) {
            gcOptions.url = gcOptions.uri
            delete gcOptions.uri
        }
        if ( typeof gcOptions.url == 'string' ) gcOptions.url = urlParser( gcOptions.url )
        gcOptions.url.host = gcOptions.url.hostname = gcOptions.url.host || gcOptions.url.hostname
    
        // only authorized users with access token, over https
        gcOptions.url.protocol = 'https:'
        if ( !gcOptions.method ) gcOptions.method = 'GET'
        if ( !gcOptions.headers ) gcOptions.headers = {}

        // first check access token expiration, then let 'er rip!
        firebase.auth().currentUser.getIdToken()
        .then( (token) => {
            gcOptions.headers.authorization = `Firebase ${token}`
            return applib.request( gcOptions )
        })
        .then( (response) => {
            const status = response.statusCode
            const body = response.body
            if ( status >= 400 ) {
                return reject( { code: status, message: body } )
            }
            resolve( applib.isJSON( body ) ? applib.parseJSON( body ) : body )
        })
        .catch( (error) => {
            reject( error )
        })        
    })
}

/**
 * Completes the authentication workflow for a new user. As a side effect, the user credential will be
 * saved in the local keychain so it can be recovered on a subsequent session without forcing the user to 
 * log in again.
 * @param {object} newUser - This is an object passed from the Web UI for authentication after a successful registration of a new user
 * @returns {Promise} A Promise object representing the user object
 * @alias module:auth
 */
function signInNewUser( newUser )
{
    // We will use a firebase custom token to pass credentials from the web process.
    // This is why a service account must be registered in firebase-config.json
    // see: https://firebase.google.com/docs/auth/admin/create-custom-tokens#sign_in_using_custom_tokens_on_clients
    // see: https://firebase.google.com/docs/reference/node/firebase.auth.Auth#signinwithcustomtoken 
    return new Promise((resolve, reject) => {
        global.user = newUser.user
        const getToken = firebase.functions().httpsCallable('customToken')
        getToken( { userid: newUser.user.uid, serviceAccountId: global.fbConfig.serviceAccountId } )
        .then( (result) => {
            return result.data
        })
        .then( ( customToken ) => {
            return firebase.auth().signInWithCustomToken(customToken)
        })
        .then( (whatToken) => {
            // returns a UserCredential: https://firebase.google.com/docs/reference/node/firebase.auth#usercredential
            resolve( whatToken.user )
        })
        .catch( (error) => {
            console.error( "function error: ", error )
        })
    })
    /*
        // IF Google decides to return an oauth refresh token, we would be able to use that to 
        // refresh the IDP token and pass that back to the main app to sign in. This works, 
        // however the token expires an hour after the first sign in, so that would force the
        // user to sign in frequently, mostly defeating the auth persistence feature. Instead 
        // we are now using a custom token to transfer credentials, as coded above.

        const authCredential = firebase.auth.AuthCredential.fromJSON( newUser.credential )
        return firebase.auth().signInWithCredential( authCredential ) 
        .then( (thisCredential) => {
            resolve( firebase.auth().currentUser )
        })
        .catch( (error) => {
            console.error( "signInWithCredential ERROR: ", error )
            reject( error )
        })
    */
}

/**
 * Initiates the Firebase UI authentication workflow. nodeIntegration must be set to false because it would
 * expose the login page to hacking through the IPC interface.
 * @param {BrowserWindow} mainWindow - The parent (or main) window, so that the workflow window can be modal
 * @returns {Promise} A Promise object representing the new modal window for authentication workflow
 * @alias module:auth
 */
function startNewSignIn( bSignOutUser )
{
    const urlParams = {
        protocol: "https",
        hostname: "localhost",
        port: global.appConfig.webapp.port,
        pathname: global.appConfig.webapp.loginStart,
        query: {
            loginRedirect: global.appConfig.webapp.loginRedirect,
            firebaseconfig: global.appConfig.apis.firebaseconfig,
            logintoken: global.appConfig.apis.logintoken,
            loginready: global.appConfig.apis.loginready
        }
    }
    if ( bSignOutUser ) urlParams.query.signoutuser = true
    if ( global.appConfig.webapp.persistentUser ) urlParams.query.persistentUser = true
    const loginUrl = urlFormat( urlParams )

    return window.openModal( loginUrl, null, { 
        width: 1200, 
        height: 800,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: false
        }
    })
}

/**
 * Gets the identity provider that was used to authenticate the current user.
 * @returns {string} The firebase representation of the identity provider, can be any of:             
 * "google.com",
 * "github.com",
 * "twitter.com",
 * "facebook.com",
 * "password",
 * "phone"
 * @alias module:auth
 */
function getProvider()
{
    // get the current user and authentication provider
    return ( global.currentUser || {} ).providerId || null
}

/**
 * Firebase UI doesn't have a workflow for logging out from the identity provider, so this function
 * returns a URL that can be used to log out directly -- if the identity provider doesn't change the URL.
 * @param {string} provider - The name of the identity provider, from getProvider()
 * @returns {string} A URL that can be called to log out of the identity provider
 * @alias module:auth
 */
function getSignOutUrl( provider )
{
    if ( !provider ) provider = getProvider()
    if ( !provider ) return null
    return global.appConfig.logout[provider] || null
}

/**
 * Logs out the user from Firebase, but not from the identity provider. 
 * @alias module:auth
 */
function signOutUser()
{
    // perform the firebase logout, which must be done both here in the main app and also in the browser
    return firebase.auth().signOut()
}

/**
 * Performs a complete signout from Firebase and the identity provider.
 * @param {string} provider - The identity provider, from getProvider()
 * @param {BrowserWindow} mainWindow - A parent window, so the logout window can be modal
 * @returns {BrowserWindow} A new window that was used for the identity provider logout
 * @alias module:auth
 */
function signOutProvider( provider, mainWindow )
{
    // clear all the browser session state, after a logout
    mainWindow.webContents.session.clearStorageData()
    mainWindow.webContents.session.clearCache( () => {} )

    const signoutUrl = getSignOutUrl( provider )
    if ( !signoutUrl ) return null

    var logoutWindow = window.openModal( signoutUrl, mainWindow, { 
        width: 1200, 
        height: 800,
        webPreferences: {
            nodeIntegration: false
        }
    })

    // logout pages will try to redirect after logout, so catch that event and close the window
    logoutWindow.webContents.on( 'did-navigate', (appEvent,tourl) => {
        logoutWindow.close()
        logoutWindow = null
    })

    return logoutWindow
}

function getCurrentUser()
{
    return firebase.auth().currentUser
}

module.exports = {
    getProvider: getProvider,
    getSignOutUrl: getSignOutUrl,
    signInNewUser: signInNewUser,
    startNewSignIn: startNewSignIn,
    signOutUser: signOutUser,
    signOutProvider: signOutProvider,
    initializeFirebase: initializeFirebase,
    gcpApi: gcpApi,
    userPath: userPath,
    getCurrentUser: getCurrentUser,
    firestore: firestore
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}
