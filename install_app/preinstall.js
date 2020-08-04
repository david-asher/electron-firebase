/* preinstall.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 *
 * pre-installation script for electron-firebase
 */
'use strict';

const it = require( './install-tools' )
const { env } = require( 'process' )

//(function ()
//{
    env.npm_config_loglevel = "error"
    console.log( "Please be patient, electron and firebase are large projects and installation may take a few minutes." )
    it.makeNpmGlobal( ".npm-global" )
    it.installApp( 'node-gyp', "npm install -g --silent node-gyp" )
//})()