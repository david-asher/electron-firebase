// test_fbstorage.js
'use strict';

const assert = require('assert').strict

// module under test:
const { fbstorage } = require('../electron-firebase')

// specimens
const jsonDoc = global.readFile( "./tests/generated.json" )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]

var errorCount = 0

const folderPath = "testFolder"
const filePath = `${folderPath}/path_to_file.whatever`

const makeFileSet = [
    `${folderPath}/junk-one/temp-two/test-file-A.tmp`,
    `${folderPath}/junk-one/temp-two/test-file-B.tmp`,
    `${folderPath}/junk-one/temp-four/test-file-C.tmp`,
    `${folderPath}/junk-one/temp-six/test-file-D.tmp`,
    `${folderPath}/junk-two/temp-four/test-file-E.tmp`,
    `${folderPath}/junk-two/temp-five/test-file-F.tmp`,
    `${folderPath}/junk-two/temp-five/test-file-G.tmp`,
    `${folderPath}/junk-three/temp-six/test-file-H.tmp`,
    `${folderPath}/junk-three/temp-six/test-file-J.tmp`
]

const checkFileList = [
    [`${folderPath}/junk-one/temp-two`,2],
    [`${folderPath}/junk-one/temp-four`,1],
    [`${folderPath}/junk-one/temp-six`,1],
    [`${folderPath}/junk-two/temp-four`,1],
    [`${folderPath}/junk-two/temp-five`,2],
    [`${folderPath}/junk-three/temp-six`,2]
]

async function testallFunctions( store ) 
{
    console.log( ">> upload" )
    var uploadResult = await store.upload( filePath, testObj )
    assert.equal( filePath, uploadResult.path )

    console.log( ">> about" )
    var aboutResult = await store.about( filePath )
    assert.equal( uploadResult.docid, aboutResult.docid )
    assert.equal( uploadResult.fullPath, aboutResult.fullPath )
    assert.equal( uploadResult.size, aboutResult.size )
    assert.equal( uploadResult.updated, aboutResult.updated )

    console.log( ">> download" )
    var fileContent = await store.download( filePath )
    assert.deepEqual( testObj, fileContent )

    console.log( ">> find" )
    var foundFile = await store.find( filePath )
    assert.equal( filePath, foundFile.path )
    assert.equal( uploadResult.docid, foundFile.docid )

    console.log( ">> update" )
    var fileMeta = await store.update( filePath, { 
        contentEncoding: 'gzip',
        contentType: 'text/html'
    } )
    assert.equal( fileMeta.contentEncoding, 'gzip' )
    assert.equal( fileMeta.contentType, 'text/html' )


    console.log( ">> folders" )
    for ( var k in makeFileSet ) {
        uploadResult = await store.upload( makeFileSet[k], testObj )
    }
    var folderList = await store.folders( folderPath )
    assert.equal( 7, folderList.length )

    console.log( ">> list" )
    for ( var j in checkFileList ) {
        var fileList = await store.list( checkFileList[j][0] )
        assert.equal( fileList.length, checkFileList[j][1] )
    }

    console.log( ">> delete" )
    for ( var m in makeFileSet ) {
        await store.delete( makeFileSet[m] )
    }
    folderList = await store.folders( folderPath )
    assert.equal( 0, folderList.length )
    var deleteResult = await store.delete( filePath )
    assert( !deleteResult )
    aboutResult = await store.about( filePath )
    assert.ok( !aboutResult.exists )

    return true
}

async function testall( domain )
{
    try {
        await testallFunctions(  fbstorage[domain] )
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
