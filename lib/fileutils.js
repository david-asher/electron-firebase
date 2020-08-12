/* fileutils.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * @module file
 * Functions for local file I/O. All functions are synchronous.
 */

const fs = require('fs')
const { execSync } = require('child_process');
const applib = require('./applibrary')

/**
 * Reads a local file and returns the contents.
 * @param {string} fileName - Path to local file
 * @return {string|buffer} - File contents, will be converted to a string if possible
 * @alias module:file
 */
function readFile( fileName )
{
    try {
        const fileRaw = fs.readFileSync( fileName )
        return Buffer.isBuffer( fileRaw ) ? fileRaw.toString() : fileRaw
    }
    catch (error) {
        console.error( "readFile error on ", fileName, ": ", error )
        return null
    }
}

/**
 * Writes buffer or string content to a local file.
 * @param {string} fileName - Path to local file
 * @param {string|buffer} fileContent - Content to write
 * @alias module:file
 */
function writeFile( fileName, fileContent )
{
    try {
        fs.writeFileSync( fileName, fileContent )
        return true
    }
    catch (error) {
        console.error( "writeFile error on ", fileName, ": ", error )
        return false
    }
}

/**
 * Check if a local file exists.
 * @param {string} fileName - Path to local file
 * @return {boolean} True if the file exists
 * @alias module:file
 */
function isFile( fileName )
{
    try {
        return fs.statSync( fileName ).isFile()
    }
    catch (error) {
        return false
    }
}

/**
 * Check if the given path is a folder.
 * @param {string} folderName - Path to local folder
 * @return {boolean} True if the give path exists and is a folder
 * @alias module:file
 */
function isFolder( folderName )
{
    try {
        return fs.statSync( folderName ).isDirectory()
    }
    catch (error) {
        return false
    }
}

/**
 * Create a new folder at the given path.
 * @param {string} folderName - Path to local folder
 * @return {boolean} True if the folder was successfully created
 * @alias module:file
 */
function makeFolder( folderName )
{
    try {
        fs.mkdirSync( folderName )
        return isFolder( folderName )
    }
    catch (error) {
        return false
    }
}

// filter the list of DirEnt objects
function _filterFolder( dirEntList, filterType )
{
    const flist = []
    dirEntList.forEach( (element,index) => {
        if ( element.name.charAt( 0 ) == '.' ) return
        switch( filterType ) {
            case 1: 
                if ( element.isFile() ) flist.push( element.name )
                break
            case 2: 
                if ( element.isDirectory() ) flist.push( element.name )
                break
        }
    })
    return flist
}

/**
 * Return a list of folders at the given path. Does not include hidden folders. 
 * @param {string} folderName - Path to local folder
 * @return {array} A list of folder names
 * @alias module:file
 */
function listFolders( folderName )
{
    try {
        const dirList = fs.readdirSync( folderName, { withFileTypes: true } )
        return _filterFolder( dirList, 2 )
    }
    catch (error) {
        return null
    }
}

/**
 * Return a list of files at the given path. Does not include hidden files.
 * @param {string} folderName - Path to local folder
 * @return {array} A list of files names
 * @alias module:file
 */
function listFiles( folderName )
{
    try {
        const dirList = fs.readdirSync( folderName, { withFileTypes: true } )
        return _filterFolder( dirList, 1 )
    }
    catch (error) {
        return null
    }
}

/**
 * Delete the folder at the given path.
 * @param {string} folderName - Path to local folder
 * @return {boolean} Returns true if the folder was successfully deleted
 * @alias module:file
 */
function deleteFolder( folderName )
{
    try {
        fs.rmdirSync( folderName )
        return !isFolder( folderName )
    }
    catch (error) {
        return false
    }
}

/**
 * Deletes the local file.
 * @param {string} fileName - Path to local file
 * @return {boolean} True if the file exists and was deleted.
 * @alias module:file
 */
function deleteFile( fileName )
{
    try {
        // unlinkSync returns nothing, even in error case
        if ( !isFile(fileName) ) return false
        fs.unlinkSync( fileName )
        return !isFile(fileName)
    }
    catch (error) {
        console.error( "deleteFile error on ", fileName, ": ", error )
        return false
    }
}

/**
 * Reads the local JSON file and returns its object representation.
 * @param {string} fileName - Path to local file
 * @return {object} Contents of the local file parsed as an object
 * @alias module:file
 */
function readJSON( fileName )
{
    var fileContent = readFile( fileName )
    if ( !fileContent ) return null
    return applib.parseJSON( fileContent )
}

/**
 * Writes a serializable object as JSON to a local file.
 * @param {string} fileName - Path to local file
 * @param {object} fileContent - Content to write as JSON
 * @alias module:file
 */
function writeJSON( fileName, fileContent )
{
    writeFile( fileName, applib.stringifyJSON( fileContent ) )
}

/**
 * Given an object, reads a local JSON file and merges the object with file contents, writing back the merged object as JSON.
 * @param {string} fileName - Path to local file
 * @param {object} updateObject - A serializable object to be merged with the JSON file
 * @alias module:file
 */
function updateJSON( fileName, updateObject )
{
    const jCurrent = readJSON( fileName )
    const jUpdate = applib.mergeObjects( jCurrent, updateObject )
    writeFile( fileName, applib.stringifyJSON( jUpdate ) )
}

/**
 * Checks whether the command exists, i.e. can be run with an exec() statement.
 * @param {string} commandString - A shell comment to be tested
 * @return {boolean} True if the command exists
 * @alias module:file
 */
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

module.exports = {
    readFile: readFile,
    writeFile: writeFile,
    deleteFile: deleteFile,
    isFile: isFile,
    isFolder: isFolder,
    makeFolder: makeFolder,
    listFolders: listFolders,
    listFiles: listFiles,
    deleteFolder: deleteFolder,
    readJSON: readJSON,
    writeJSON: writeJSON,
    updateJSON: updateJSON,
    checkCommand: checkCommand
}
