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
console.log( "process.env.PWD = ", process.env.PWD )
console.log( "process.env.INIT_CWD = ", process.env.INIT_CWD )

// console.log( "process.env = ", process.env )
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
const { chdir, exit } = require( 'process' )

function parentPath( filePath )
{
    return filePath.split( path.sep ).slice( 0, -1 ).join( path.sep ) + path.sep
}

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

function isObject( it )
{
    return ( Object.prototype.toString.call( it ) === '[object Object]' )
}

function omerge( oTarget, oUpdate ) 
{
    if ( !isObject( oUpdate ) ) return oUpdate
    for ( var key in oUpdate ) {
        oTarget[key] = omerge( oTarget[key], oUpdate[key] )
    }
    return oTarget
}

function postInstall() 
{
    // set loglevel to quiet multiple warnings that we can't control
    process.env.npm_config_loglevel = "error"

    var moduleRoot = `${process.cwd()}${path.sep}`
    var projectRoot = `${process.env.INIT_CWD}${path.sep}`
    // for local testing:
//    var moduleRoot = parentPath( __dirname ) 
//    var projectRoot = `${process.cwd()}${path.sep}`

    console.log( "moduleRoot = ", moduleRoot )
    console.log( "projectRoot = ", projectRoot )

    console.log( "** Populate top-level folders" )
    newFolders.forEach( (folderName) => {
        copyFolder( folderName, moduleRoot, projectRoot )
    })

    console.log( "** Copy sample application files" )
    appFileList.forEach( (fileName) => {
        copyFile( fileName, moduleRoot, projectRoot )
    })

    console.log( "** Update package.json scripts" )
    const packageFile = projectRoot + "package.json"
    const packageCopy = projectRoot + "package.old.json"
    const packageSource = require( packageFile )
    fs.copyFileSync( packageFile, packageCopy )
    const packageUpdate = require( `${moduleRoot}${path.sep}install_app${path.sep}package-update.json` )
    fs.writeFileSync( packageFile, JSON.stringify( omerge( packageSource, packageUpdate ), null, 2 ) )

    console.log( "** Rebuilding Electron, this will take a few minutes." )
    execSync( "npm run rebuild" )

    console.log( "** Installing firebase-tools, required to deploy functions to the cloud." )
    execSync( "npm install -g firebase-tools" )
}

(function ()
{
    try {
        postInstall()
    }
    catch(error) {
        console.log( error )
    }
    exit( 0 )
})()

