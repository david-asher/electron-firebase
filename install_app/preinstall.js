/* preinstall.js
 * Copyright (c) 2019-2020 by David Asher, https://github.com/david-asher
 *
 * pre-installation script for electron-firebase
 */
'use strict';

const { execSync } = require( 'child_process' )

const it = require( './install-tools' )
const { env } = require( 'process' );
// yes the above needs a semicolon else the IIFE below throws an error. whatever.

(function ()
{
    env.npm_config_loglevel = "error"
    console.log( "Please be patient, electron and firebase are large projects and installation may take a few minutes." )
    it.makeNpmGlobal( ".npm-global" )
////    it.installApp( 'node-gyp', "npm install -g --silent node-gyp" )
    it.installApp( 'node-gyp', "npm install -g node-gyp" )

console.log( "PATH = ", execSync( "echo $PATH" ).toString() )

console.log( "node-gyp = ", execSync( "node-gyp --version" ).toString() )

})()
