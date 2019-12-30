/* postinstall.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 *
 * post-installation script for electron-firebase
 */
'use strict';

/*
console.log( "- - - - - - - - - postinstall.js - - - - - - - - -" )
console.log( "__dirname = ", __dirname )
console.log( "__filename = ", __filename )
console.log( "process.env.INIT_CWD = ", process.env.INIT_CWD )
console.log( "process.env.PWD = ", process.env.PWD )
console.log( "gencert = ", process.env.npm_package_scripts_gencert )
*/


console.log( "process.env = ", process.env )

const files = require( './modules/fileutils' )
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

//if ( process.env.INIT_CWD == process.env.PWD ) {
if ( process.env.INIT_CWD == process.cwd() ) {
    // it's running from project root and not the module subfolder
    process.exit( 0 )
}

// generate a new self-signed cert for localhost
// do this first in case openssl isn't there, don't wait until install finishes to find out
// then just copy the created/modified files from /cert and /config
console.log( "** Generate self-signed certificate" )
execSync( process.env.npm_package_scripts_gencert )

const newFolders = [
    "cert",
    "config",
    "css",
    "fonts",
    "pages",
    "scripts",
    "sample"
]

// set loglevel to quiet multiple warnings that we can't control
// process.env.loglevel = "silent"

console.log( "** Populate top-level folders" )
newFolders.forEach( (foldername) => {
    console.log( "foldername = " + foldername )
    const targetFolder = `${process.env.INIT_CWD}${path.sep}${foldername}`
    const sourceFolder = `${process.cwd()}${path.sep}${foldername}`
    console.log( "targetFolder = " + targetFolder )
    console.log( "sourceFolder = " + sourceFolder )
    files.makeFolder( targetFolder )
    const fileList = files.listFiles( sourceFolder )
    console.log( "fileList = " + fileList )
    // console.log( `sourceFolder: ${sourceFolder}, `, fileList )
    if ( !fileList ) return
    fileList.forEach( (filename) => {
        console.log( `source: ${sourceFolder}${path.sep}${filename}, target: ${targetFolder}${path.sep}${filename}` )
        fs.copyFileSync( `${sourceFolder}${path.sep}${filename}`, `${targetFolder}${path.sep}${filename}` )
        // execSync( `cp "${sourceFolder}/${filename}" "${targetFolder}"` )
    })
})

const targetFolder = `${process.env.INIT_CWD}`

console.log( "** Update package.json" )
// first make a backup of the package.json file
if ( !files.isFile( `${targetFolder}${path.sep}package.old.json` ) ) {
    console.log( `source: ${targetFolder}${path.sep}package.json, target: ${targetFolder}${path.sep}package.old.json` )
    fs.copyFileSync( `${targetFolder}${path.sep}package.json`, `${targetFolder}${path.sep}package.old.json` )
    // execSync( `cp "${targetFolder}/package.json" "${targetFolder}/package.old.json"` )
}

const sourceFolder = `${process.cwd()}`

console.log( `readJSON: ${sourceFolder}${path.sep}package-template.json` )
const packageTemplate = files.readJSON( `${sourceFolder}${path.sep}package-template.json` )
files.updateJSON( `${targetFolder}${path.sep}package.json`, packageTemplate )

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
