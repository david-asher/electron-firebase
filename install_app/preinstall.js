/* preinstall.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 *
 * pre-installation script for electron-firebase
 */
'use strict';

const { execSync } = require( 'child_process' )
const { exit } = require('process')
const it = require( './install-tools' )

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

it.installApp( 'node-gyp', "npm install -g node-gyp" )
