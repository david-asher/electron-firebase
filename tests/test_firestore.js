// test_firestore.js
'use strict';

const assert = require('assert').strict

// module under test:
const { data } = require('../electron-firebase')

const extraCollection = "__extra__c__"
const tempDocName = "temp-object-doc.js"
const testFieldName = "eyeColor"
const testFieldValue = "blue"
const testFieldChanged = "purple"

// specimens
const jsonDoc = global.readFile( global.testDocPath )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]

function _catchHandler( error )
{
    return Promise.reject( error )
}

async function testall()
{
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

    return true
}

module.exports = {
    target: () => { return data.modulename() },
    testall: testall
}


