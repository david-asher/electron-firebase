/* webserver.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * This module sets up a local webserver which is primarily used for secure communication with 
 * a BrowserWindow. Although it is possible to use IPC for this purpose, that would require enabling 
 * the nodeIntegration option for the window, which would expose the app to all manner of mischief. 
 * The webserver is an instance of express, configured for HTTPS with a self-signed cert.
 * @module server
 */

const https = require('https')
const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')

const files = require('./fileutils')
const appserver = express()
var webtls 

/*
 * This is a hook into an HTTP received request. Since we are using localhost and a self-signed
 * certificate, we want to reject the error that this would normally generate, but only on the 
 * condition that it happens with our self-signed cert. We do this check by examining the
 * cert fingerprint.
 * @see {@link https://electronjs.org/docs/api/app#event-certificate-error|app event: certificate-error}
 */
function _checkCertificate( event, webContents, url, error, certificate, callback ) 
{
    // disable the certificate signing error only if this is our certificate
    var isOurCert = false
    if ( certificate.fingerprint == global.appConfig.https.fingerprint ) {
        event.preventDefault()
        isOurCert = true
    }
    callback( isOurCert )
}

/*
 * Another security check. This function is in the express routing chain for /api/... calls.
 * It will check that /api calls cannot come from an external computer. 
 */
function _checkOurApp( req, res, next ) 
{
    const referer = ( req.headers || {} ).referer || ""
    if ( !req.secure || !referer.match( global.appConfig.webapp.hostUrl ) ) {
        res.status( 401 ).send( "Unauthorized" )
        return
    }
    next()
}

function _getWebOptions()
{
    const projectRoot = process.env.INIT_CWD
    return {
        key: files.readFile( `${projectRoot}/${global.appConfig.https.keyFile}` ),
        cert: files.readFile( `${projectRoot}/${global.appConfig.https.certFile}` ),
        requestCert: false,
        rejectUnauthorized: false
    }
}

function _useStaticFolders( folderList )
{
    if ( !Array.isArray( folderList ) ) folderList = [ folderList ]
    folderList.forEach( (folder) => {
        const slashFolder = '/' + folder.replace(/^\/+/, '')
        appserver.use( slashFolder, express.static( process.env.INIT_CWD + slashFolder ) )
    })
}

/**
 * This function will start the HTTPS local webserver and configure static document serving.
 * @param {app} mainApp - The Electron main app
 * @param {array} staticFolders - A list of folder names to be configured for static document serving
 * @returns {Promise<express>} Returns a reference to the express middleware that can be used to create API routes
 * @see {@link https://electronjs.org/docs/api/app#app|Electron app}
 * @see {@link https://expressjs.com/|expressjs}
 * @alias module:server
 */
function start( mainApp, staticFolders )
{
    return new Promise( ( resolve, reject ) =>
    {
        // support json encoded bodies
        appserver.use(bodyParser.json()); 
        appserver.use(bodyParser.urlencoded({ extended: true }));

        // In order to use a self signed certificate without throwing an error but still have security, 
        // we check to make sure that only our certificate can be used; any other self-signed cert
        // shouldn't happen in our app, and will throw an error
        mainApp.on( 'certificate-error', _checkCertificate )

        // security checks
        appserver.use( '/api', _checkOurApp )
        appserver.use( helmet() )
        
        _useStaticFolders( staticFolders )

        webtls = https.createServer( _getWebOptions(), appserver )
        webtls.listen( global.appConfig.webapp.port, async () => {
            console.log( "TLS server on port " + webtls.address().port )
            resolve( appserver )
        })
    })
}

module.exports = {
    start: start
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}
