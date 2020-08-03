/* preinstall.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 *
 * pre-installation script for electron-firebase
 */
'use strict';

const { execSync } = require( 'child_process' );
const { exit } = require('process');

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

// check for command existence before installing node-gyp
if ( !checkCommand( 'node-gyp' ) ) {
    execSync( "npm install -g node-gyp" )
}
// if we did not have have permission, install would have failed, so try again as su
if ( !checkCommand( 'node-gyp' ) ) {
    execSync( "sudo npm install -g node-gyp" )
}
// if all of this failed, stop, because we can't build without node-gyp
if ( !checkCommand( 'node-gyp' ) ) {
    console.error( "Cannot find node-gyp and failed to install it. " )
    console.error( "Please check permissions and try to install node-gyp yourself before proceding." )
    exit(23)
}

