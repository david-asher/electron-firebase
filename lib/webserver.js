/* webserver.js
 * Copyright (c) 2019-2021 by David Asher, https://github.com/david-asher
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
const helmet = require('helmet')

var appserver
var webtls 
var certFingerprint

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
    if ( certificate.fingerprint == certFingerprint ) { 
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
    const referer = ( req.headers || {} ).host || ""
    if ( !req.secure || !referer.match( global.appConfig.webapp.hostPort ) ) {
        res.status( 401 ).send( "Unauthorized" )
        return
    }
    next()
}

/*
 * The WebOptions are required to specify the certificate for TLS.
 * A new self-signed certificate is generated every time the app starts. 
 * The cert is used to apply TLS to the webserver that runs in the main app,
 * and enables a secure connection from a browser window without having to
 * enable IPC for the browser. 
 */
function _getWebOptions()
{
    const selfsigned = require('selfsigned')
    const forge = require('node-forge')

    const attrs = [
        { name: "commonName", value: global.appContext.name },
        { name: "countryName", value: global.appContext.countryCode },
        { name: "organizationName", value: "Self-Signed" }
    ]
    const pems = selfsigned.generate(attrs, { days: 365 })
    const originalCert = forge.pki.certificateFromPem(pems.cert)
    const asn1Cert = forge.pki.certificateToAsn1(originalCert)
    const asn1Encoded = forge.asn1.toDer(asn1Cert).getBytes()
    const fingerprintDigest = forge.md.sha256.create().update(asn1Encoded).digest()
    certFingerprint = "sha256/" + forge.util.encode64(fingerprintDigest.getBytes())

    return {
        key: pems.private,
        cert: pems.cert,
        requestCert: false,
        rejectUnauthorized: false
    }
}

/*
 * This function will start the HTTPS local webserver and configure static document serving.
 * @param {app} mainApp - The Electron main app
 * @param {array} staticFolders - A list of folder names to be configured for static document serving
 * @returns {Promise<express>} Returns a reference to the express middleware that can be used to create API routes
 * @see {@link https://electronjs.org/docs/api/app#app|Electron app}
 * @see {@link https://expressjs.com/|expressjs}
 * @alias module:server
 */
function logRequest( req, options, callback )
{
    var reqReturn
    var responseHandler
    function logResponse( response )
    {
        console.log( `RESPONSE (${Date.now()}): `, response.statusCode, response.statusMessage, response.headers )
        if ( responseHandler ) responseHandler.apply( this, arguments )
    }
    console.log( `REQUEST (${Date.now()}): `, req )
    // call the original 'request' function   
    if ( typeof options == 'function' ) {
        responseHandler = options
        reqReturn = logRequest.originalHttpsRequest( req, logResponse )
    }
    else {
        responseHandler = callback
        reqReturn = logRequest.originalHttpsRequest( req, options, logResponse )
    }
    return reqReturn
}

/**
 * Start the HTTPS server for the Main node.js process. 
 * @param {object} mainApp - Reference to the Electron app
 * @param {array} staticFolders - List of folders that will be exposed from the webserver as static content
 * @alias module:server
 */
function start( mainApp, staticFolders )
{
    // axios doesn't have a debug facility the way that request has, so put in
    // request and response hooks so we can log the network traffic
    if ( global.appConfig.debugMode ) {
        logRequest.originalHttpsRequest = https.request
        https.request = logRequest
    }

    return new Promise( ( resolve, reject ) =>
    {
        try {
            appserver = express()

            // support json encoded bodies
            appserver.use(express.json()); 
            appserver.use(express.urlencoded({ extended: true }));

            // In order to use a self signed certificate without throwing an error but still have security, 
            // we check to make sure that only our certificate can be used; any other self-signed cert
            // shouldn't happen in our app, and will throw an error
            mainApp.on( 'certificate-error', _checkCertificate )

            // security checks
            appserver.use( '/api', _checkOurApp )
            appserver.use( helmet() )
            
            // set ContentSecurityPolicy header for all local web pages
            appserver.use((req, res, next) => {
                res.set( 'Content-Security-Policy', global.ContentSecurityString )
                next();
            });

            // set up static web content folders
            const folderOptions = {
                index: false,
                maxAge: '1d',
                redirect: false,
            }
            if ( 'string' == typeof (staticFolders) ) staticFolders = staticFolders.split( /,|;/ )
            staticFolders.forEach( (folder) => {
                const slashFolder = '/' + folder.replace(/^\/+/, '')
                appserver.use( slashFolder, express.static( process.env.INIT_CWD + slashFolder, folderOptions ) )
            })

            // start the secure web server
            webtls = https.createServer( _getWebOptions(), appserver )
            webtls.listen( global.appConfig.webapp.port, () => {
                // console.log( "TLS server on port " + webtls.address().port )
                resolve( appserver )
            })
        }
        catch (error) {
            console.error( "webserver.start: ", error )
        }
    })
}

module.exports = {
    start: start
}

