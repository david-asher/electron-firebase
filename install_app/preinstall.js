/* preinstall.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 *
 * pre-installation script for electron-firebase
 */
'use strict';

const { execSync } = require( 'child_process' )

function checkCommand( commandString )
{
    var exists = true
    try {
        execSync( `which ${commandString}` )
    }
    catch (error) {
        exists = false
    }
    return exists
}

process.env.npm_config_loglevel = "error"

console.log( "Please be patient, electron and firebase are large projects and installation may take a few minutes." )

if ( !checkCommand( 'node-gyp' ) ) {
    execSync( "npm install -g node-gyp" )
}
