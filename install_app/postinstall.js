/* postinstall.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
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

const fs = require('fs')
const path = require('path')

if ( process.env.INIT_CWD == process.cwd() ) {
    // it's running from project root and not the module subfolder, this won't work
    process.exit( 0 )
}

// set loglevel to quiet multiple warnings that we can't control
// process.env.loglevel = "silent"

const moduleRoot = `${process.cwd()}${path.sep}`
const projectRoot = `${process.env.INIT_CWD}${path.sep}`

const newFolders = [
    "pages",
    "scripts",
    "functions"
]

const appFileList = [
    "answerBrowser.js",
    "setupApp.js",
    "main.js"
]

function copyFile( filename, sourceFolder, targetFolder )
{
    fs.copyFileSync( `${sourceFolder}${path.sep}${filename}`, `${targetFolder}${path.sep}${filename}` )
}

function copyFolderFiles( sourceFolder, targetFolder )
{

console.log( "source: ", sourceFolder )
console.log( "target: ", targetFolder )

    const dirList = fs.readdirSync( sourceFolder, { withFileTypes: true } )
    dirList.forEach( (file) => {
        if ( !file.isFile() ) return

console.log( "copying: ", file.name )

        copyFile( file.name, sourceFolder, targetFolder )
    })
}

function copyFolder( folderName )
{
    const sourceFolder = moduleRoot + folderName
    if ( !fs.statSync( sourceFolder ).isDirectory() ) {
        console.error( "Source folder does not exist: ", sourceFolder )
        return
    }

    const targetFolder = projectRoot + foldername
    fs.mkdirSync( targetFolder )
    if ( !fs.statSync( targetFolder ).isDirectory() ) {
        console.error( "Failed to create target folder: ", targetFolder )
        return
    }

    copyFolderFiles( sourceFolder, targetFolder )
}


(function () 
{
    console.log( "** Populate top-level folders" )
    newFolders.forEach( (folderName) => {
        copyFolder( folderName )
    })

    appFileList.forEach( (fileName) => {
        copyFile( fileName, moduleRoot, projectRoot )
    })
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
