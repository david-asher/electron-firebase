/* gencert.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 *
 * generate a self-signed cert 
 * saves the key and cert files to the location in appconfig.json
 * writes the cert sha256 fingerprint back to appconfig.json
 */
'use strict';

const appConfigFile = 'config/app-config.json'

const files = require( './modules/fileutils' )
const { execSync } = require( 'child_process' )
const fs = require('fs')

// check for openssl, otherwise this won't work
if ( !files.checkCommand( "openssl" ) ) {
    console.error( "ERROR: openssl was not found and is required for this script" )
    process.exit( 404 ) // not found
}

// read the app configuration file
const appConfig = files.readJSON( appConfigFile )
const certFile = appConfig.https.certFile
const keyFile = appConfig.https.keyFile

// define the openssl commands, 20-year cert so we won't have to rotate it, probably not, naw
const cmdGenCert = `openssl req -days 7300 -subj /CN=localhost -x509 -newkey rsa:2048 -nodes -keyout ${keyFile} -out ${certFile}`
const cmdFingerprint = `openssl x509 -in ${certFile} -fingerprint -sha256 -noout`
// const cmdMakeCertFolder = `mkdir -p cert`

// generate a new self-signed certificate and store in the key and cert files
//// execSync( cmdMakeCertFolder )
if ( !fs.existsSync("cert") ) {
    fs.mkdirSync( "cert" )
}
execSync( cmdGenCert )

// print out the sha256 fingerprint
const fpExecBuffer = execSync( cmdFingerprint )

// convert exec output to base64 string
const fpHexString = fpExecBuffer.toString().split("=")[1].replace( /:/g, '' ).replace(/\n/g, '' )
const fpBuf = Buffer.from( fpHexString, 'hex' )

// console.log( "fpHexString = ", fpHexString )
// console.log( "fpBuf = ", fpBuf )

// update the app config file
files.updateJSON( appConfigFile, {
    https: {
        fingerprint: "sha256/" + fpBuf.toString( 'base64' ),
        "hex-fingerprint": fpHexString
    }
})

