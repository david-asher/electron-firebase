/* postinstall.js
 * Copyright (c) 2019-2020 by David Asher, https://github.com/david-asher
 *
 * post-installation script for electron-firebase
 */
'use strict';

// /*
console.log( "- - - - - - - - - postinstall.js - - - - - - - - -" )
console.log( "__dirname = ", __dirname )
console.log( "__filename = ", __filename )
console.log( "process.cwd() = ", process.cwd() )
// console.log( "process.env = ", process.env )
console.log( "process.env.PWD = ", process.env.PWD )
console.log( "process.env.INIT_CWD = ", process.env.INIT_CWD )
// */

// process.cwd() is root of electron-firebase folder in node_modules
// process.env.INIT_CWD is root of project folder
// __dirname is postinstall script folder

const newFolders = [
    "config",
    "pages",
    "scripts",
    "functions"
]

const appFileList = [
    "answerBrowser.js",
    "setupApp.js",
    "main.js"
]

const fs = require('fs')
const path = require('path')
const { execSync } = require( 'child_process' )
const { chdir } = require( 'process' )

function copyFile( filename, sourceFolder, targetFolder )
{
    const atThisTime = new Date()
    const sourceFile = `${sourceFolder}${path.sep}${filename}`
    const targetFile = `${targetFolder}${path.sep}${filename}`
    fs.copyFileSync( sourceFile, targetFile )
    fs.utimesSync( targetFile, atThisTime, atThisTime )
}

function copyFolderFiles( sourceFolder, targetFolder )
{ 
    const dirList = fs.readdirSync( sourceFolder, { withFileTypes: true } )
    dirList.forEach( (file) => {
        if ( !file.isFile() ) return
        copyFile( file.name, sourceFolder, targetFolder )
    })
}

function makeFolder( folderPath )
{
    try {
        fs.mkdirSync( folderPath )
    }
    catch( error ) {
        if ( error && error.code == 'EEXIST' ) return
        console.error( error )
    } 
}

function copyFolder( folderName, sourceParent, targetParent )
{
    const sourceFolder = sourceParent + folderName
    if ( !fs.statSync( sourceFolder ).isDirectory() ) {
        console.error( "Source folder does not exist: ", sourceFolder )
        return
    }

    const targetFolder = targetParent + folderName
    makeFolder( targetFolder )
    if ( !fs.statSync( targetFolder ).isDirectory() ) {
        console.error( "Failed to create target folder: ", targetFolder )
        return
    }
    copyFolderFiles( sourceFolder, targetFolder )
}


(function () 
{
    // set loglevel to quiet multiple warnings that we can't control
    // process.env.loglevel = "silent"

    var moduleRoot = `${process.cwd()}${path.sep}`
    var projectRoot = `${process.env.INIT_CWD}${path.sep}`

    // this condition lets us test this script without doing a full install
    if ( moduleRoot == projectRoot ) {
        moduleRoot += `node_modules${path.sep}electron-firebase${path.sep}`
    }

    console.log( "moduleRoot = ", moduleRoot )
    console.log( "projectRoot = ", projectRoot )

    console.log( "** Populate top-level folders" )
    newFolders.forEach( (folderName) => {
        copyFolder( folderName, moduleRoot, projectRoot )
    })

    appFileList.forEach( (fileName) => {
        copyFile( fileName, moduleRoot, projectRoot )
    })

    console.log( "** Rebuilding Electron, this will take a few minutes." )
    execSync( "./node_modules/.bin/electron-rebuild" )

    console.log( "** Installing firebase-tools, required to deploy functions to the cloud." )
    chdir( "./functions")
    execSync( "npm install -g firebase-tools" )
    chdir( "../")

})()

/*
const targetFolder = `${process.env.INIT_CWD}`
console.log( "** Update package.json" )
// first make a backup of the package.json file
if ( !files.isFile( `${targetFolder}${path.sep}package.old.json` ) ) {
    console.log( `source: ${targetFolder}${path.sep}package.json, target: ${targetFolder}${path.sep}package.old.json` )
    fs.copyFileSync( `${targetFolder}${path.sep}package.json`, `${targetFolder}${path.sep}package.old.json` )
    // execSync( `cp "${targetFolder}/package.json" "${targetFolder}/package.old.json"` )
}
*/
/*
const sourceFolder = `${process.cwd()}`
console.log( `readJSON: ${sourceFolder}${path.sep}package-template.json` )
const packageTemplate = files.readJSON( `${sourceFolder}${path.sep}package-template.json` )
files.updateJSON( `${targetFolder}${path.sep}package.json`, packageTemplate )
*/
/*******************
// if we don't rebuild, electron won't work properly with gRPC
console.log( "** npm install from source !! PLEASE BE PATIENT !! " )
//// execSync( "npm config set [--global] loglevel silent && npm install --build-from-source --no-warnings --silent" )
execSync( "npm install --build-from-source" )
***********/
/***
console.log( "** Rebuild electron !! BE PATIENT SOME MORE !!" )
execSync( `.${path.sep}node_modules${path.sep}.bin${path.sep}electron-rebuild` )
***/
