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

const uidSymbol = "<<UID_HERE>>"
const filepath = "testFolder/path_to_file.whatever"
const filemeta =  { 
    name: `users/${uidSymbol}/Test/FileTest`,
    bucket: 'your-app-here.appspot.com',
    generation: '123456789123456',
    metageneration: '1',
    contentType: 'application/json',
    timeCreated: '2019-02-05T03:06:24.435Z',
    updated: '2019-02-05T03:06:24.435Z',
    storageClass: 'STANDARD',
    size: '1005',
    md5Hash: 'H3Anb534+vX2Y1HVwJxlyw==',
    contentEncoding: 'identity',
    contentDisposition: 'inline; filename*=utf-8\'\'FileTest',
    crc32c: 'yTf15w==',
    etag: 'AAAAAAA=',
    downloadTokens: '00000000' 
}
const metaKnown = { 
  fullPath: '',
  name: 'FileTest',
  parent: 'Test',
  contentType: 'application/json',
  timeCreated: '2019-02-05T03:06:24.435Z',
  updated: '2019-03-06T04:36:50.853Z',
  size: '1005',
  md5Hash: 'H3Anb534+vX2Y1HVwJxlyw==',
  path: 'Test/FileTest'
}

function _catchHandler( error )
{
    return Promise.reject( error )
}

async function testallFunctions( store ) 
{
    // uploadFile( filepath, contents )
    console.log( ">> upload" )
    var uploadResult = await store.upload( filepath, testObj )
    assert.equal( filepath, uploadResult.path )

    // aboutFile( filepath, bIncludeMetadata )
    console.log( ">> about" )
    var aboutResult = await store.about( filepath )
    assert.equal( uploadResult.docid, aboutResult.docid )
    assert.equal( uploadResult.fullPath, aboutResult.fullPath )
    assert.equal( uploadResult.size, aboutResult.size )
    assert.equal( uploadResult.updated, aboutResult.updated )

    // downloadFile( filepath )
    console.log( ">> download" )
    var fileContent = await store.download( filepath )
    assert.deepEqual( testObj, fileContent )

    // findFileByPath( filepath )
    console.log( ">> find" )
    var foundFile = await store.find( filepath )
    assert.equal( filepath, foundFile.path )
    assert.equal( uploadResult.docid, foundFile.docid )

    // updateFileMeta( filepath, metadata )
    console.log( ">> update" )
    var fileMeta = await store.update( filepath, { 
        contentEncoding: 'gzip',
        contentType: 'text/html'
    } )
    assert.equal( fileMeta.contentEncoding, 'gzip' )
    assert.equal( fileMeta.contentType, 'text/html' )

    // deleteFile( filepath )
    console.log( ">> delete" )
    var deleteResult = await store.delete( filepath )
    // should return nothing but no error
    assert( !deleteResult )
    aboutResult = await store.about( filepath )
    assert( !aboutResult.exists )

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
