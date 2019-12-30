// test_fbstorage.js
'use strict';

const assert = require('assert').strict

// module under test:
const { store } = require('../electron-firebase')

// specimens
const jsonDoc = global.readFile( "./tests/generated.json" )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]

const uidSymbol = "<<UID_HERE>>"
const filepath = "test/this/path_to_file.whatever"
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

async function testall() 
{
    // _userPrefix( filepath )
    console.log( ">> _userPrefix" )
    const userPath = store.probe( "_userPrefix", filepath )
    assert.equal( `users/${global.user.uid}/${filepath}`, userPath )

    // _objectPathUrl( filepath )
    console.log( ">> _objectPathUrl" )
    const objectPath = store.probe( "_objectPathUrl", filepath )
    assert.equal( "googleapis.com", objectPath.hostname.split(".").slice(1).join(".") )
    assert( 0 < objectPath.pathname.indexOf( encodeURIComponent( userPath ) ) )

    // _metaFixup( fileMeta )
    console.log( ">> _metaFixup" )
    metaKnown.fullPath = filemeta.name = filemeta.name.replace( uidSymbol, global.user.uid )
    const fixMeta = store.probe( "_metaFixup", filemeta )
    assert.equal( fixMeta.name, metaKnown.name )
    assert.equal( fixMeta.fullPath, metaKnown.fullPath )
    assert.equal( fixMeta.timeCreated, metaKnown.timeCreated )
    assert.equal( fixMeta.md5Hash, metaKnown.md5Hash )

    // _makeUploadOptions( filepath, contents )
    console.log( ">> _makeUploadOptions" )
    const checkOptDoc = store.probe( "_makeUploadOptions", filepath, jsonDoc )
    assert( checkOptDoc.json )
    assert.equal( checkOptDoc.method, 'POST' )
    assert.equal( "googleapis.com", checkOptDoc.url.hostname.split(".").slice(1).join(".") )
    assert.deepEqual( checkOptDoc.body, testDoc )

    // uploadFile( filepath, contents )
    let uploadResult, aboutResult
    console.log( ">> uploadFile" )
    await store.uploadFile( filepath, testObj )
    .then( async (result) => {
        uploadResult = result
        assert.equal( filepath, uploadResult.path )
    })
    .catch( _catchHandler )

    // aboutFile( filepath, bIncludeMetadata )
    console.log( ">> aboutFile" )
    await store.aboutFile( filepath, true )
    .then( async (result) => {
        aboutResult = result
        assert.equal( uploadResult.docid, aboutResult.docid )
        assert.equal( uploadResult.fullPath, aboutResult.fullPath )
        assert.equal( uploadResult.size, aboutResult.size )
        assert.equal( uploadResult.updated, aboutResult.updated )
    })
    .catch( _catchHandler )

    // downloadFile( filepath )
    console.log( ">> downloadFile" )
    await store.downloadFile( filepath )
    .then( async (content) => {
        assert.deepEqual( testObj, content )
    })
    .catch( _catchHandler )

    // findFileByPath( filepath )
    console.log( ">> findFileByPath" )
    await store.findFileByPath( filepath )
    .then( async (foundFile) => {
        assert.equal( filepath, foundFile.path )
        assert.equal( uploadResult.docid, foundFile.docid )
    })
    .catch( _catchHandler )

    // updateFileMeta( filepath, metadata )
    console.log( ">> updateFileMeta" )
    await store.updateFileMeta( filepath, { 
        contentEncoding: 'gzip',
        contentType: 'text/html'
    } )
    .then( async (fileMeta) => {
        assert.equal( fileMeta.contentEncoding, 'gzip' )
        assert.equal( fileMeta.contentType, 'text/html' )
    })
    .catch( _catchHandler )

    // deleteFile( filepath )
    console.log( ">> deleteFile" )
    await store.deleteFile( filepath )
    .then( async (result) => {
        // should return nothing but no error
        assert( !result )
    })
    .then( () => {
        // now prove it!
        return store.aboutFile( filepath, true )
    })
    .then( async (result) => {
        // the real file was deleted, too
        assert( !result )
    })
    .catch( _catchHandler )

    return true
}

module.exports = {
    target: () => { return store.modulename() },
    testall: testall
}
