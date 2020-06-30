// test_firestore.js
'use strict';

const assert = require('assert').strict

// module under test:
const { firestore } = require('../electron-firebase')

const extraCollection = "__extra__c__"
const tempDocName = "temp-object-doc.js"
const testFieldName = "eyeColor"
const testFieldValue = "blue"
const testFieldChanged = "purple"

const testMergeName = "height"
const testMergeValue = "medium"
const testUpdateBogusDoc = "testAlpha/does_not_exist"

// specimens
const jsonDoc = global.readFile( global.testDocPath )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]
const mergeObj = {}
mergeObj[testMergeName] = testMergeValue

const testPath = "testAlpha/docOne.json"

const domains = [ 'doc', 'app', 'public' ]

function _catchHandler( error )
{
    return Promise.reject( error )
}

async function testallFunctions( data )
{
    console.log( ">> write" )
    await data.write( testPath, testObj )

    console.log( ">> about (ignore possible GRPC stream error)" )
    var aboutResult = await data.about( testPath )
    assert.ok( aboutResult.exists )
    assert.equal( aboutResult.id, testPath.split("/").pop() )
    assert.equal( aboutResult.get("guid"), testObj.guid )

    console.log( ">> read" )
    var readResult = await data.read( testPath )
    assert.deepEqual( testObj, readResult )

    console.log( ">> merge" )
    assert.ok( !readResult[testMergeName] )
    await data.merge( testPath, mergeObj )
    readResult = await data.read( testPath )
    assert.ok( aboutResult.exists )
    assert.equal( readResult[testMergeName], testMergeValue )
    assert.equal( aboutResult.get("guid"), testObj.guid )

    console.log( ">> update" )
    await data.write( testPath, testObj )
    readResult = await data.read( testPath )
    assert.ok( !readResult[testMergeName] )
    await data.update( testPath, mergeObj )
    readResult = await data.read( testPath )
    assert.ok( aboutResult.exists )
    assert.equal( readResult[testMergeName], testMergeValue )
    assert.equal( aboutResult.get("guid"), testObj.guid )
    await data.update( testUpdateBogusDoc, mergeObj )
    var aboutResult = await data.about( testUpdateBogusDoc )
    assert.ok( !aboutResult.exists )


    return true
//////////////// NEED TO TEST MERGE

//    assert.deepEqual( testObj, readResult )

    /*
    // listRootCollections( bGetFromServer )
    console.log( ">> listRootCollections" )
    await data.listRootCollections()
    .then( async(rootList) => {
        assert( rootList.indexOf( 'files') >= 0 )
        assert( rootList.indexOf( 'docs') >= 0 )
        assert( rootList.indexOf( 'apps') >= 0 )
    })
    .catch( _catchHandler )

    // updateArrayElement( docRef, arrayName, newValue, bGetFromServer )
    // removeArrayElement( docRef, arrayName, oldValue, bGetFromServer )
    // NOTE: these functions are tested within addToRootCollections and removeFromRootCollections

    // addToRootCollections( collectionName )
    console.log( ">> addToRootCollections" )
    await data.addToRootCollections( extraCollection )
    .then( async () => {
        return await data.listRootCollections()
    })
    .then( async (rootList) => {
        assert( 0 <= rootList.indexOf( extraCollection ) )
        return true
    })
    .catch( _catchHandler )

*/

/*
    // removeFromRootCollections( collectionName )
    console.log( ">> removeFromRootCollections" )
    await data.removeFromRootCollections( extraCollection )
    .then( async () => {
        return await data.listRootCollections()
    })
    .then( async (rootList) => {
        assert( 0 > rootList.indexOf( extraCollection ) )
        return true
    })
    .catch( _catchHandler )

    // docRef( rootCollection, docPath )
    // NOTE: docRef is tested in all other functions

    // docCreate( rootCollection, docPath, contents )
    // docRead( rootCollection, docPath, bGetFromServer )
    // docAbout( rootCollection, docPath, bGetFromServer )
    console.log( ">> docCreate" )
    await data.docCreate( data.FILES, tempDocName, testObj ) 
    .then( async (docResult) => {
        console.log( ">> docAbout" )
        return await data.docAbout( data.FILES, tempDocName, true )
    })
    .then( async (aboutDoc) => {
        console.log( ">> docRead" )
        assert( aboutDoc.exists )
        return await data.docRead( data.FILES, tempDocName, true )
    })
    .then( async (docContent) => {
        assert.deepEqual( testObj, docContent )
        return true
    })
    .catch( _catchHandler )

    // docGetField( rootCollection, docPath, fieldName, bGetFromServer )
    console.log( ">> docGetField" )
    await data.docGetField( data.FILES, tempDocName, testFieldName, true )
    .then( async (fieldValue) => {
        assert.equal( fieldValue, testFieldValue )
    }) 
    .catch( _catchHandler )

    // docFind( rootCollection, fieldName, fieldMatch, matchOperator )
    console.log( ">> docFind" )
    await data.docFind( data.FILES, testFieldName, testFieldValue )
    .then( async (docFound) => {
        assert( !docFound.empty )
        assert.equal( docFound.size, 1 )
        assert.equal( docFound.docs[0].data()[testFieldName], testFieldValue )
    }) 
    .catch( _catchHandler )

    // docUpdate( rootCollection, docPath, contents )
    console.log( ">> docUpdate" )
    const testUpdate = {}
    testUpdate[testFieldName] = testFieldChanged
    await data.docUpdate( data.FILES, tempDocName, testUpdate )
    .then( async () => {
        return await data.docGetField( data.FILES, tempDocName, testFieldName, true )
    }) 
    .then( async (fieldValue) => {
        assert.equal( fieldValue, testFieldChanged )
    }) 
    .catch( _catchHandler )

    // docDelete( rootCollection, docPath )
    console.log( ">> docDelete" )
    await data.docDelete( data.FILES, tempDocName )
    .then( async () => {
        return await data.docFind( data.FILES, testFieldName, testFieldValue )
    })
    .then( async (docFound) => {
        assert( docFound.empty )
    }) 
    .catch( _catchHandler )

    // buildUserDocSet( user )
    // setup( user, bForceUpdate )
    // NOTE: these functions are executed in the base testing document, else several
    // unit tests wouldn't run
*/
    return true
}

async function testall()
{
    return await testallFunctions( firestore.doc )

//    await domains.forEach( async (element) => {
//        console.log( `========= ${element} =========` )
//        await testallFunctions( firestore[ element ] )
//    })
}

module.exports = {
    testall: testall
}


