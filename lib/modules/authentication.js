/* authentication.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Authentication workflow for Google Firebase. 
 * @see {@link https://github.com/firebase/FirebaseUI-Web|FirebaseUI for Web}
 * @module auth
 */

const keytar = require('keytar')
const firebase = require('firebase')
const urlParser = require('url').parse

const applib = require( './applibrary' )
const local = require( './localstorage' )
const window = require( './windows' )

// constants
const maxErrorRetry     = 6                  // don't allow network retries more than this
const keyCredential     = 'credential'       // key for safe credential storage
const keyUserProfile    = 'userprofile'      // key for saving the indentity provider's profile info
const keyRefreshToken   = 'refreshtoken'     // for this session, store the user's refresh token

// local variables (note: .user is bogus, a starting point for test apps)
const firebaseTokenReset = { expires: 4, error: 0, user: "avOLAIDar6abcJNhg6QIhEZECz" }
var firebaseToken = { ...firebaseTokenReset }

// refreshOptions is the configuration for token refresh via REST API
const refreshOptions = {
    method: 'POST',
    uri: {
        protocol: 'https:',
        host: 'securetoken.googleapis.com',
        hostname: 'securetoken.googleapis.com',
        pathname: '/v1/token'
    },
    form: {
        "grant_type": "refresh_token",
    } 
}

const signinOauthOptions = {
    method: 'POST',
    uri: {
        protocol: 'https:',
        host: 'identitytoolkit.googleapis.com',
        hostname: 'identitytoolkit.googleapis.com',
        pathname: '/v1/accounts:signInWithIdp'
    },
    form: {
        requestUri: null,
        postBody: null,
        returnSecureToken: true,
        returnIdpCredential: true
    } 
}

const accountInfoOptions = {
    method: 'POST',
    uri: {
        protocol: 'https:',
        host: 'www.googleapis.com',
        hostname: 'www.googleapis.com',
        pathname: '/identitytoolkit/v3/relyingparty/getAccountInfo'
    },
    form: {
        idToken: "id token"
    } 
}

/**
 * Must be called before any operations on Firebase API calls.
 * @alias module:auth
 */
function initializeFirebase()
{
    // the apikey is needed for refreshing the access token
    refreshOptions.qs = {
        key: global.fbConfig.apiKey
    }

    accountInfoOptions.qs = {
        key: global.fbConfig.apiKey
    }

    signinOauthOptions.qs = {
        key: global.fbConfig.apiKey
    }

    firebase.initializeApp( global.fbConfig );
    firebase.auth().onAuthStateChanged( _changeUserEvent );
    firebase.auth().onIdTokenChanged( _changeTokenEvent );
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

function _loadToken( refreshPayload )
{
    if ( !refreshPayload ) return null
    var payload = applib.parseJSON( refreshPayload )
    if ( !payload ) return null
    return {
        access:     payload.access_token,
        idtoken:    payload.id_token,
        expires:    Math.max( 30, payload.expires_in - 600 ),
        updated:    Date.now(),
        type:       payload.token_type,
        user:       payload.user_id,
        project:    payload.project_id,
        errors:     0
    }
}

function _tryRefreshAgain()
{
    setTimeout( _refreshGcpToken, 1000 * firebaseToken.expires )
}

function getFreshToken( thisUser )
{
    if ( !thisUser ) thisUser = global.currentUser.firebaseUser
    if ( !thisUser ) {
        return Promise.reject( "Cannot refresh token; no current user." )
    }
    return thisUser.getIdToken() 
/*
    return new Promise( ( resolve, reject ) =>
    {    
        if ( !thisUser ) {
            return reject( "Cannot refresh token; no current user." )
        }


console.log( "getFreshToken, thisUser = ", thisUser )

        thisUser.getIdToken()
        .then( (token) => {
            console.log( "getFreshToken: ", token )
            resolve( token )
        })
        .catch( (error) => {
            reject( error )
        })
    })
    */
}

async function _getRefreshedToken( response ) 
{
    // check for invalid refresh token (400) and other bad request errors, don't retry
    const status = response.statusCode
    const body = response.body
    if ( status >= 400 ) {
        console.error( "_getRefreshedToken ERROR: ", status, body )
        throw new Error( "This session is no longer valid. Please sign out and sign in again." )
    }

    // check if we got a valid token back from the service
    var refreshResponse = _loadToken( body ) 
    if ( refreshResponse ) {
        // cache the access token as a local
        firebaseToken = refreshResponse
        return firebaseToken
    }

    // all other error cases
    console.error( "_getRefreshedToken ERROR: ", firebaseToken.errors, status, body )
    if ( ++firebaseToken.errors > maxErrorRetry ) {
        // stop the madness
        throw new Error( "Timeout during network request. Check your network connections." )
    }

    // set refresh timer with exponential backoff, rinse, repeat
    firebaseToken.expires *= 4
    _tryRefreshAgain()
}

function _refreshGcpToken( bAutoRefresh )
{
    return new Promise( ( resolve, reject ) =>
    {    

console.log(  "_refreshGcpToken, firebaseToken = ", firebaseToken )

        // check for valid token and return immediately
        if ( firebaseToken && ( firebaseToken.updated + firebaseToken.expires > Date.now() ) ) {
            resolve( firebaseToken )
            return
        }
    
        // reset the error count and expiration timer
        firebaseToken = { ...firebaseTokenReset }

console.log(  "... after reset, firebaseToken = ", firebaseToken )
    
        // get the refresh token from secure storage, then issue the request
        keytar.getPassword( global.fbConfig.projectId, keyRefreshToken )
        .then( (secretSerialized) => {

console.log(  "... getPassword, ", global.fbConfig.projectId, keyRefreshToken, ", secretSerialized = ", secretSerialized )

            refreshOptions.form[ "refresh_token" ] = secretSerialized
            return applib.request( refreshOptions )
        })
        // did we get a valid token?
        .then( (response) => {

console.log(  "... applib.request, statusCode = ", response.statusCode, response.statusMessage )

            return _getRefreshedToken( response )
        })
        .then( (token) => {

console.log(  "... _getRefreshedToken, token = ", token )

            if ( bAutoRefresh ) _tryRefreshAgain()

            resolve( token )
        })
        .catch( (error) => {
            console.error( "_refreshGcpToken ERROR, cannot recover token ", error )
            reject( "Cannot recover your credentials. Please sign out and sign in again." )
        })    
    })
}

/**
 * Return the unique path prefix for a user.
 * @returns {string} A path string
 * @alias module:auth
 */
function userPath()
{
    return `users/${firebaseToken.user}`
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
        gcOptions.headers.authorization = `${firebaseToken.type} ${firebaseToken.access}`

        // first check access token expiration, then let 'er rip!
////        _refreshGcpToken()
        getFreshToken()
        .then( (token) => {
            return applib.request( gcOptions )
        })
        .then( (response) => {
            const status = response.statusCode
            const body = response.body
            if ( status >= 400 ) {
                reject( { code: status, message: body } )
                return
            }
            resolve( applib.isJSON( body ) ? applib.parseJSON( body ) : body )
        })
        .catch( (error) => {
            reject( error )
        })        
    })
}

function _convertToOAuth( providerId, userIdentity )
{
    // returns: https://firebase.google.com/docs/reference/node/firebase.auth.OAuthCredential
    if ( !userIdentity ) return null

    try {
        switch( providerId  ) {
        case 'google.com':
            return firebase.auth.GoogleAuthProvider.credential( userIdentity ) //.idToken || userIdentity.accessToken ) // 
        case 'facebook.com':
            return firebase.auth.FacebookAuthProvider.credential( userIdentity.accessToken )
        case 'twitter.com':
            return firebase.auth.TwitterAuthProvider.credential( userIdentity.accessToken, userIdentity.secret )
        case 'github.com':
            return firebase.auth.GithubAuthProvider.credential( userIdentity.accessToken )
        case 'password':
            return firebase.auth.EmailAuthProvider.credentialWithLink( userIdentity.email, userIdentity.emailLink )
        case 'phone':
            return firebase.auth.PhoneAuthProvider.credential( userIdentity.verificationId, userIdentity.verificationCode )
        }
    }
    catch (error) {
        console.log( "_convertToOAuth ERROR: ", error )
    }
    return null
}

function _newUserProfile( currentUser, profile )
{

console.log( "_newUserProfile: ", currentUser )

    global.currentUser = currentUser.user.toJSON()
    global.currentUser.lastSignInTime = currentUser.user.metadata.lastSignInTime || null
    global.currentUser.creationTime = currentUser.user.metadata.creationTime || null
    global.currentUser.providerId = currentUser.credential.providerId
    global.currentUser.firebaseUser = currentUser.user

    // don't leave the good stuff lying around
    delete global.currentUser.stsTokenManager
    delete global.currentUser.credential
    global.currentUser.profile = profile
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
console.log( "signInNewUser, newUser = ", newUser ) ///// .additionalUserInfo )
    // this case happens on a first successful login, a new user is presented
    return new Promise((resolve, reject) => {

        var thisUser = firebase.auth().currentUser
        if ( thisUser ) {
            console.log( "this user: ", thisUser.displayName )
            resolve( thisUser )
            return
        }

        if ( newUser.operationType == "signIn" ) {

            const authCredentialIdentity = firebase.auth.AuthCredential.fromJSON( newUser.credentialIdentity )
            const authCredentialAccess = firebase.auth.AuthCredential.fromJSON( newUser.credentialAccess )

            console.log( "authCredentialIdentity: ", authCredentialIdentity )
            console.log( "authCredentialAccess: ", authCredentialAccess )
            return firebase.auth().signInWithCredential( authCredentialIdentity ) 
            .then( (thisCredential) => {
                thisUser = firebase.auth().currentUser
                console.log( "signInNewUser thisCredential: ", thisCredential.credential )
                console.log( "this user: ", thisUser.displayName )

                keytar.deletePassword( global.fbConfig.projectId, keyCredential )
                keytar.deletePassword( global.fbConfig.projectId, keyCredential + "Access" )

                keytar.setPassword( global.fbConfig.projectId, keyCredential, applib.stringifyJSON( authCredentialIdentity ) )
                keytar.setPassword( global.fbConfig.projectId, keyCredential + "Access", applib.stringifyJSON( authCredentialAccess ) )

                resolve( thisUser )
            })
            .catch( (error) => {
                console.log( "signInWithCredential ERROR: ", error )
                reject( error )
            })
            return
        }


        keytar.getPassword( global.fbConfig.projectId, keyCredential ) // + "Access"
        .then( (serialCredential) => {
            console.log( "serialCredential: ", typeof serialCredential, serialCredential )
            const authCredential = firebase.auth.AuthCredential.fromJSON( serialCredential )
            console.log( "authCredential: ", authCredential )

        // signinOauthOptions
        signinOauthOptions.form[ "requestUri" ] = "http://localhost:3090/api/oauthsignin"
        signinOauthOptions.form[ "postBody" ] = {
            id_token: authCredential.idToken,
            providerId: "google.com"
        }
        console.log( "signinOauthOptions: ", signinOauthOptions )
        applib.request( signinOauthOptions )
        .then( (response) => {
            console.log( "signinOauthOptions response: ", response.statusCode, response.body )
        })


            return authCredential
        })
        .then( (authCredential) => {
            return firebase.auth().signInWithCredential( authCredential ) 
        })
        .then( (userCredential) => {
            console.log( "userCredential user: ", userCredential.user.toJSON() )
            console.log( "userCredential credential: ", userCredential.credential )
            console.log( "userCredential additionalUserInfo: ", userCredential.additionalUserInfo )
            console.log( "userCredential operationType: ", userCredential.operationType )
            resolve( firebase.auth().currentUser )
        })
        .catch( (error) => {
            console.log( "signInWithCredential ERROR: ", error )
            reject( error )
        })


        /*
        console.log( "newUser.idToken: ", typeof newUser.idToken, newUser.idToken )
        const authCredential = firebase.auth.GoogleAuthProvider.credential( newUser.idToken )
        console.log( "authCredential: ", typeof authCredential, authCredential )
        firebase.auth().signInWithCredential( authCredential ) 
        .then( (userCredential) => {
            console.log( "userCredential: ", userCredential )
            resolve( userCredential )
        })
        .catch( (error) => {
            console.log( "signInWithCredential ERROR: ", error )
            reject( error )
        })
        */

/*
        var freshToken
        refreshOptions.form[ "refresh_token" ] = newUser.user.stsTokenManager.refreshToken
        applib.request( refreshOptions )
        .then( (response) => {
            freshToken = JSON.parse( response.body )
            console.log( "freshToken = ", freshToken )
            return keytar.getPassword( global.fbConfig.projectId, keyCredential )
        })
        .then( (serialCredential) => {
            console.log( "serialCredential: ", typeof serialCredential, serialCredential )
            return firebase.auth.AuthCredential.fromJSON( serialCredential )
        })
        .then( (authCredential ) => {
            console.log( "authCredential: ", authCredential )
            return firebase.auth().signInWithCredential( authCredential ) 
        })
        .then( (userCredential) => {
            console.log( "userCredential: ", userCredential.credential )
            resolve( firebase.auth().currentUser )
        })
        .catch( (error) => {
            console.log( "signInWithCredential ERROR: ", error )
            reject( error )
        })
    */

/**************
// https://accounts.google.com/ServiceLogin
// getProjectConfig
// verifyAssertion
        var providerId, accessToken
        console.log( "getting password for ", global.fbConfig.projectId, keyCredential )
        keytar.getPassword( global.fbConfig.projectId, keyCredential )
        .then( (serialCredential) => {
            console.log( "serialCredential: ", typeof serialCredential, serialCredential )
            const authCredential = firebase.auth.AuthCredential.fromJSON( serialCredential )
            providerId = authCredential.providerId
            accessToken = authCredential.accessToken
            console.log( "authCredential: ", authCredential )

            return authCredential
        })
        .then( (authCredential) => {
            console.log( "authCredential: ", authCredential )
            refreshOptions.form[ "refresh_token" ] = newUser.user.stsTokenManager.refreshToken
            return applib.request( refreshOptions )
        })
        .then( (response) => {
            const newToken = JSON.parse( response.body )
            console.log( "newToken = ", newToken )
            const providerCredential = _convertToOAuth( newUser.providerId, newUser ) //// newToken.id_token )
////            const providerCredential = _convertToOAuth( providerId, accessToken ) //// newToken.id_token )
            console.log( "providerCredential = ", providerCredential )
            return firebase.auth().signInWithCredential( providerCredential ) 

//            return firebase.auth().signInWithCredential( authCredential ) 
        })
        .then( (thisCredential) => {
            thisUser = firebase.auth().currentUser
            console.log( "signInNewUser thisCredential: ", thisCredential.credential )
            console.log( "this user: ", thisUser.displayName )
            keytar.setPassword( global.fbConfig.projectId, keyCredential, applib.stringifyJSON( thisCredential.credential ) )
            resolve( thisUser )

        })
        .catch( (error) => {
            console.log( "signInWithCredential ERROR: ", error )
            reject( error )
        })
****************/



//        const oAuthCredential = _convertToOAuth( newUser )
//console.log( "oAuthCredential = ", oAuthCredential )
//        var userCredential, signedInUser
//        var userIdToken

/******
        refreshOptions.form[ "refresh_token" ] = newUser.stsTokenManager.refreshToken
        applib.request( refreshOptions )
        .then( (response) => {
            const accessResponse = JSON.parse( response.body )
            console.log( "token refresh: ", accessResponse )
            const authCredential = _convertToOAuth( newUser.providerData[0].providerId, accessResponse ) // userCredential  )
            authCredential.id_token = "" + authCredential.oauthIdToken
            console.log( "authCredential 1: ", typeof authCredential, authCredential )
            
            firebase.auth().signInWithCredential( authCredential ) //// oAuthCredential ) 
            .then( (thisCredential) => {
                console.log( "signedInUser: ", thisCredential ) //// signedInUser ) //// .credential, signedInUser.additionalUserInfo ) 
            })
            .catch( (error) => {
    
    console.log( "this user is ", firebase.auth().currentUser )
    
                console.log( "ERRORERROR: ", error )
            })
        })
        .catch( (error) => {
            console.log( "refresh ERROR, ", error )
        })
******/

/****
 * 

        .then( (thisCredential) => {
            userCredential = thisCredential
////            signedInUser = userCredential.user
console.log( "signedInUser: ", thisCredential ) //// signedInUser ) //// .credential, signedInUser.additionalUserInfo ) 
            return signedInUser
////            return signedInUser.getIdToken()
        })
        .then( (idToken) => {
            userIdToken = {
                providerId: oAuthCredential.providerId,
                idToken: oAuthCredential.idToken
            }
console.log( "userIdToken: ", userIdToken ) 
        })
        .then( () => {

console.log( "signInWithCredential: ", userCredential.user.displayname, userCredential.credential )
            // returns: https://firebase.google.com/docs/reference/node/firebase.auth.html#.UserCredential
            // save the refresh token for this session, for later refresh of the access token
            //// userCredential = credential
console.log( "setPassword: ", global.fbConfig.projectId, keyRefreshToken, userCredential.user.refreshToken )
            keytar.setPassword( global.fbConfig.projectId, keyRefreshToken, userCredential.user.refreshToken )
            // save the OAuth credentials for session persistence, in the computer's secure keychain
//////console.log( "setPassword: ", global.fbConfig.projectId, keyCredential, applib.stringifyJSON( newUser.credential ) )
//////            keytar.setPassword( global.fbConfig.projectId, keyCredential, applib.stringifyJSON( newUser.credential ) )
console.log( "setPassword: ", global.fbConfig.projectId, keyCredential, applib.stringifyJSON( userIdToken )) //// oAuthCredential ) )
//////            keytar.setPassword( global.fbConfig.projectId, keyCredential, applib.stringifyJSON( userCredential.credential )) ////oAuthCredential ) )
            keytar.setPassword( global.fbConfig.projectId, keyCredential, applib.stringifyJSON( userIdToken ) ) ////oAuthCredential ) )
            // save the user's identity provider profile since we won't see it again
console.log( "setItem: ", keyUserProfile, newUser.profile )
            local.setItem( keyUserProfile, newUser.profile )
            // start the auto-update process for access tokens
////            return _refreshGcpToken( true )


console.log( "calling getFreshToken... " )

            // declare the new user
            _newUserProfile( userCredential, newUser.profile )

            return getFreshToken() ////  credential.user )
        })
        .then( (token) => {
            // report back the original user object; do not further expose credentials          
            // and start the auto-update process for access tokens
            resolve( global.currentUser )
        })
        .catch( (error) => {
            applib.event.emit( "show-error", error )
            reject( error )
        })

****/

    })
}

/**
 * Completes the authentication workflow for an existing user, recovering the user credential from the local keychain.
 * @param {object} newUser - This is an object passed from the Web UI for authentication after a successful login of an existing user
 * @returns {Promise} A Promise object representing the user object
 * @alias module:auth
 */
function signInSavedUser()
{

console.log( "starting signInSavedUser" )

    return new Promise((resolve, reject) => {
        var userCredential, refreshResponse
        // this case happens on a normal app startup, check if there is a persistent session
        keytar.getPassword( global.fbConfig.projectId, keyRefreshToken )
        .then( (refreshTokenSerialized) => {
            if ( !refreshTokenSerialized ) return reject( "No valid ID token has been saved" )
            console.log( "keytar refreshTokenSerialized: ", refreshTokenSerialized )
            refreshOptions.form[ "refresh_token" ] = refreshTokenSerialized
            return applib.request( refreshOptions )
        })
        .then( (response) => {
            if ( !response ) return reject( "Unable to refresh saved token" )
            refreshResponse = response
            console.log( "refreshToken: ", refreshResponse.body )
            return keytar.getPassword( global.fbConfig.projectId, keyCredential )
        })
        .then( (secretSerialized) => {

console.log( "keytar.getPassword: ", global.fbConfig.projectId, keyCredential, secretSerialized )

            if ( !secretSerialized || secretSerialized == "" ) return reject( "NO SESSION on signInSavedUser" )
            // if a credential was saved in the computer's keychain, use it to login automatically
            const oAuthCredential = _convertToOAuth( applib.parseJSON( secretSerialized ) )

console.log( "oAuthCredential: ", oAuthCredential )

            return firebase.auth().signInWithCredential( oAuthCredential ) 
        })
        .then( (credential) => {

console.log( "signInWithCredential: ", credential ) ///// .user.displayname, credential.credential )

            if ( !credential ) return reject( "NO CREDENTIAL on signInSavedUser" )
            // returns: https://firebase.google.com/docs/reference/node/firebase.auth.html#.UserCredential
            // save the refresh token for later refresh of the access token
            userCredential = credential
            try {
                keytar.setPassword( global.fbConfig.projectId, keyRefreshToken, credential.user.refreshToken )
            }
            catch (error) {
                console.error( error )
            }
            // recover the identity provider profile information from localStorage
            return local.getItem( keyUserProfile )
        })
        .then ( (userSavedProfile) => {

console.log( "getItem keyUserProfile: ", userSavedProfile )

            // start the auto-update process for access tokens but don't chain the promises
            // since an error may not be a real error but a nonexistent user
////            return _refreshGcpToken( true )
            _newUserProfile( userCredential, userSavedProfile )                   
            return getFreshToken()
            .then( (token) => {

console.log( "_refreshGcpToken: ", token )

                if ( !token ) return reject( "INVALID TOKEN on signInSavedUser" )
////                _newUserProfile( userCredential, userSavedProfile )                   
                // report back the original user object; do not further expose credentials          
                resolve( global.currentUser )
            })
            .catch( (error) => {
                reject( error )
            })        
        })
        .catch( (error) => {
            console.error( error )
            // something bad happened, clean up cached values            
            keytar.deletePassword( global.fbConfig.projectId, keyCredential )
            keytar.deletePassword( global.fbConfig.projectId, keyRefreshToken )
            reject( error )
        })
    })
}


/**
 * Initiates the Firebase UI authentication workflow. nodeIntegration must be set to false because it would
 * expose the login page to hacking through the IPC interface.
 * @param {BrowserWindow} mainWindow - The parent (or main) window, so that the workflow window can be modal
 * @returns {Promise} A Promise object representing the new modal window for authentication workflow
 * @alias module:auth
 */
function startNewSignIn( newWindow )
{
    const loginUrl = `${global.appConfig.webapp.hostUrl}/${global.appConfig.webapp.login}`

    return window.openModal( loginUrl, newWindow, { 
        width: 1200, 
        height: 800,
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
    console.log( "!!ENTER signOutUser" )
    // forget the locally held session credentials
    keytar.deletePassword( global.fbConfig.projectId, keyCredential )

    // the user profile is the key to session persistence
    local.removeItem( keyUserProfile )

    // perform the firebase logout
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

function _changeUserEvent( currentUser )
{
    console.log( "AUTH CHANGED: ", currentUser ? currentUser.displayName : "NO USER" )
}

function _changeTokenEvent( currentUser )
{
    if ( !currentUser ) {
        return
    }
    // User is signed in or token was refreshed.
    console.log( "refreshToken: ", currentUser.refreshToken )
    console.log( "last sign in: ", currentUser.metadata.lastSignInTime )
    console.log( "provider id: ", currentUser.providerData[0].providerId )

}

module.exports = {
    getProvider: getProvider,
    getSignOutUrl: getSignOutUrl,
    signInNewUser: signInNewUser,
    signInSavedUser: signInSavedUser,
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
