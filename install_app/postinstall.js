/* postinstall.js
 * Copyright (c) 2019-2020 by David Asher, https://github.com/david-asher
 *
 * post-installation script for electron-firebase
 */
'use strict';

const { execSync } = require( 'child_process' )
const { exit, env } = require('process')
const path = require('path')
const it = require( './install-tools' )

const topLevelFolders = [
    "config",
    "pages",
    "scripts",
    "functions"
]

const appFileList = [
    ".firebaserc",
    "firebase.json",
    "answerBrowser.js",
    "setupApp.js",
    "main.js"
]

function postInstall() 
{
    // set loglevel to quiet multiple warnings that we can't control
    env.npm_config_loglevel = "error"
    const timeStamp = new Date()
    const { moduleRoot, projectRoot } = it.getInstallPaths()
    it.makeNpmGlobal( ".npm-global" )
    
    console.log( "** Update package.json scripts" )
    const packageFile = path.join( projectRoot, "package.json" )
    const updateFile = path.join( moduleRoot, "install_app", "package-update.json" )
    const lastUpdate = it.getModified( updateFile )
    it.updateJsonFile( packageFile, require( updateFile ) )

    console.log( "** Populate top-level folders" )
    topLevelFolders.forEach( (folderName) => {
        it.copyFolder( folderName, moduleRoot, projectRoot, timeStamp, lastUpdate )
    })

    console.log( "** Copy example application files" )
    appFileList.forEach( (fileName) => {
        it.copyFile( fileName, moduleRoot, projectRoot, timeStamp, lastUpdate )
    })

    console.log( "** Rebuilding Electron, this will take a few minutes." )
    execSync( "npm run rebuild" )

    console.log( "** Installing firebase-tools, required to deploy functions to the cloud." )
    it.installApp( 'firebase-tools', "npm install -g --silent firebase-tools" )

    // leave the package-update.json file with newer modified time so the next update can check it
    it.touchFile( updateFile )
}

(function ()
{
    try {
        postInstall()
    }
    catch(error) {
        console.log( error )
    }
    exit(0)
})()

