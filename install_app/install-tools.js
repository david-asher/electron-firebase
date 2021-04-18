/* install-tools.js
 * Copyright (c) 2019-2021 by David Asher, https://github.com/david-asher
 *
 * Helper functions for other install scripts. 
 */
'use strict';

const fs = require('fs')
const os = require('os')
const path = require('path')
const { env } = require('process')
const { execSync } = require( 'child_process' )

function getInstallPaths()
{
    // process.cwd() is root of electron-firebase folder in node_modules
    // process.env.INIT_CWD is root of project folder
    // __dirname is postinstall script folder

    var moduleRoot, projectRoot
    // moduleRoot is the source; projectRoot is the target

    if ( undefined == process.env.INIT_CWD ) {
        // for local testing, e.g. at project root, run:
        // node ./node_modules/electron-firebase/install_app/postinstall.js
        moduleRoot = path.dirname( __dirname ) 
        projectRoot = `${process.cwd()}${path.sep}`
    }
    else {
        // normal npm install case
        moduleRoot = `${process.cwd()}${path.sep}`
        projectRoot = `${process.env.INIT_CWD}${path.sep}`
    }
    return {
        moduleRoot: moduleRoot,
        projectRoot: projectRoot
    }
}

function getModified( filePath )
{
    try {
        const fileStats = fs.statSync( filePath )
        return new Date( fileStats.mtime )
    }
    catch (error) {
        return null
    }
}

function touchFile( filePath, timeStamp )
{
    if ( !timeStamp ) timeStamp = new Date()
    fs.utimesSync( filePath, timeStamp, timeStamp )
}

/*
 * This function will not overwrite a file that has been modified more
 * recently than the lastUpdate; set lastUpdate to Date.now() to force overwrite. 
 * After a successful copy the access and modified times will be set to timeStamp.
 */
function copyFile( filename, sourceFolder, targetFolder, timeStamp, lastUpdate )
{
    try {
        const sourceFile = path.join( sourceFolder, filename )
        const targetFile = path.join( targetFolder, filename )
        // check for user modified file and do not overwrite
        const mTimeTarget = getModified( targetFile )
        if ( +mTimeTarget > +lastUpdate ) return 
        // copy the file but we need to update the timestamps ourselves
        fs.copyFileSync( sourceFile, targetFile )
        touchFile( targetFile, timeStamp )
    }
    catch (error) {
        if ( error.code == 'EEXIST') return
        throw( error )
    }
}

function copyFolderFiles( sourceFolder, targetFolder, timeStamp, lastUpdate )
{ 
    const dirList = fs.readdirSync( sourceFolder, { withFileTypes: true } )
    dirList.forEach( (file) => {
        if ( !file.isFile() ) return
        copyFile( file.name, sourceFolder, targetFolder, timeStamp, lastUpdate )
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

function copyFolder( folderName, sourceParent, targetParent, timeStamp, lastUpdate )
{
    const sourceFolder = path.join( sourceParent, folderName )
    if ( !fs.statSync( sourceFolder ).isDirectory() ) {
        console.error( "Source folder does not exist: ", sourceFolder )
        return
    }

    const targetFolder = path.join( targetParent, folderName )
    makeFolder( targetFolder )
    if ( !fs.statSync( targetFolder ).isDirectory() ) {
        console.error( "Failed to create target folder: ", targetFolder )
        return
    }
    copyFolderFiles( sourceFolder, targetFolder, timeStamp, lastUpdate )
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

function backupFile( filePath )
{
    var backupParts = filePath.split( '.' )
    backupParts.splice( -1, 0, "old" )
    const backupPath = backupParts.join( '.' )
    fs.copyFileSync( filePath, backupPath )
}

function updateJsonFile( jsonFile, updateJson )
{
    const sourceJson = require( jsonFile )
    backupFile( jsonFile )
    fs.writeFileSync( jsonFile, JSON.stringify( omerge( sourceJson, updateJson ), null, 2 ) )
}

function checkCommand( commandString )
{
    var exists = true
    try {
        // stdio to pipe because we don't want to see the output
        execSync( `${commandString} --version`, {stdio : 'pipe' } )
    }
    catch (error) {
        exists = false
    }
    return exists
}

function installApp( commandString, appInstallString, bQuiet )
{
    // check for command existence before installing
    if ( !checkCommand( commandString ) ) {
        execSync( appInstallString, { stdio: bQuiet ? 'pipe' : 'inherit' } )
    }
    // if this failed, stop, because we can't build
    if ( !checkCommand( commandString ) ) {
        throw( "Cannot find " + commandString + " and failed to install it. " )
    }
}

function addToPath( newPath )
{
    env.PATH = `${newPath}${path.delimiter}${env.PATH}`
}

function makeNpmGlobal( globalFolder )
{
    const npmGlobal = path.join( os.homedir(), globalFolder )
    makeFolder( npmGlobal )
    addToPath( npmGlobal )
    const npmGlobalBin = path.join( npmGlobal, "bin" )
    makeFolder( npmGlobalBin )
    addToPath( npmGlobalBin )
    execSync( `npm config set prefix "${npmGlobal}"` ) 
}

module.exports = {
    getInstallPaths: getInstallPaths,
    getModified: getModified,
    touchFile: touchFile,
    copyFile: copyFile,
    copyFolderFiles: copyFolderFiles,
    makeFolder: makeFolder,
    copyFolder: copyFolder,
    isObject: isObject,
    omerge: omerge,
    backupFile: backupFile,
    updateJsonFile: updateJsonFile,
    checkCommand: checkCommand,
    installApp: installApp,
    addToPath: addToPath,
    makeNpmGlobal: makeNpmGlobal
}