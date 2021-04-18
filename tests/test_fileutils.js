// test_fileutils.js
'use strict';

const assert = require('assert').strict

// module under test:
const { file } = require('../electron-firebase')

const writeDocPath = "./tests/temp-write-doc.json"

// specimens
const jsonDoc = global.readFile( global.testDocPath )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]

var errorCount = 0

async function testallFunctions()
{
    // readFile( fileName )
    console.log( ">> readFile" )
    assert.equal( jsonDoc, file.readFile( global.testDocPath ) )

    // writeFile( fileName, fileContent )
    console.log( ">> writeFile" )
    file.writeFile( writeDocPath, jsonDoc )
    assert.equal( jsonDoc, file.readFile( writeDocPath ) )

    // isFile( fileName )
    console.log( ">> isFile" )
    assert( file.isFile( global.testDocPath ) )
    assert( !file.isFile( global.testDocPath + "BAD_STUFF" ) )

    // isFolder( folderName )
    console.log( ">> isFolder" )
    const testFolder = global.testDocPath.split("/").slice(0,-1).join("/")
    const newFolder = testFolder + "/newFolder"
    assert( file.isFolder( testFolder ) )
    assert( !file.isFolder( newFolder ) )

    // makeFolder( folderName )
    console.log( ">> makeFolder" )
    assert( file.makeFolder( newFolder ) )
    assert( file.isFolder( newFolder ) )

    // deleteFolder( folderName )
    console.log( ">> deleteFolder" )
    assert( file.deleteFolder( newFolder ) )
    assert( !file.isFolder( newFolder ) )

    // listFolders( folderName )
    const showFolder = "."
    console.log( ">> listFolders" )
    const folderList = file.listFolders( showFolder )
    assert( 0 <= folderList.indexOf( 'lib' ) )
    assert( 0 <= folderList.indexOf( 'pages' ) )
    assert( 0 <= folderList.indexOf( 'node_modules' ) )
    assert( 0 <= folderList.indexOf( 'tests' ) )
    assert( -1 == folderList.indexOf( 'is-not-there' ) )

    // listFiles( folderName )
    console.log( ">> listFiles" )
    const fileList = file.listFiles( showFolder )
    assert( 0 <= fileList.indexOf( 'LICENSE' ) )
    assert( 0 <= fileList.indexOf( 'electron-firebase.js' ) )
    assert( 0 <= fileList.indexOf( 'package.json' ) )
    assert( 0 <= fileList.indexOf( 'README.md' ) )
    assert( -1 == fileList.indexOf( 'is-not-there' ) )

    // deleteFile( fileName )
    console.log( ">> deleteFile" )
    assert( file.isFile( writeDocPath ) )
    file.deleteFile( writeDocPath )
    assert( !file.isFile( writeDocPath ) )

    // readJSON( fileName )
    console.log( ">> readJSON" )
    assert.deepEqual( testDoc, file.readJSON( global.testDocPath ) )

    // writeJSON( fileName, fileContent )
    console.log( ">> writeJSON" )
    file.writeJSON( writeDocPath, testObj )
    assert.deepEqual( testObj, file.readJSON( writeDocPath ) )

    // updateJSON( fileName, updateObject )
    console.log( ">> updateJSON" )
    file.updateJSON( writeDocPath, { age: 59, company: "fictionco" } )
    testObj.age = 59
    testObj.company = "fictionco"
    assert.deepEqual( testObj, file.readJSON( writeDocPath ) )

    // checkCommand( commandString )
    console.log( ">> checkCommand" )

    assert( file.checkCommand( "mkdir" ) )
    assert( !file.checkCommand( "doesNotExist" ) )

    // cleanup
    file.deleteFile( writeDocPath )
    assert( !file.isFile( writeDocPath ) )

    return true
}

async function testall()
{
    try {
        await testallFunctions()
    }
    catch (error) {
        errorCount++
        console.error( error )
    }
    return errorCount
}

module.exports = {
    testall: testall
}

