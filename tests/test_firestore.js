// test_firestore.js
'use strict';

const assert = require('assert').strict

// module under test:
const { firestore } = require('../electron-firebase')

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
const testCollection = "testAlpha"
const testDocSet = "testAlpha/docOne-"

const insertTag = "insert-this-tag"
const checkTag = "occaecat"
const tagName = "tags"

const errorCount = 0

async function testallFunctions( data )
{
    console.log( ">> write" )
    await data.write( testPath, testObj )

    console.log( ">> about" )
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
    assert.equal( readResult[testMergeName], testMergeValue )
    assert.equal( aboutResult.get("guid"), testObj.guid )
    await data.update( testUpdateBogusDoc, mergeObj )
    aboutResult = await data.about( testUpdateBogusDoc )
    assert.ok( !aboutResult.exists )

    console.log( ">> field" )
    var getField = await data.field( testPath, "guid" )
    assert.equal( getField, testObj.guid )
    getField = await data.field( testPath, "friends" )
    assert.deepEqual( getField, testObj.friends )
    getField = await data.field( testPath, "there-is-no-field" )
    assert.ok( getField == undefined )

    console.log( ">> union" )
    assert.equal( 7, ( await data.field( testPath, tagName ) ).length )
    await data.union( testPath, tagName, checkTag )
    await data.union( testPath, tagName, checkTag )
    await data.union( testPath, tagName, checkTag )
    assert.equal( 7, ( await data.field( testPath, tagName ) ).length )
    await data.union( testPath, tagName, insertTag )
    await data.union( testPath, tagName, insertTag )
    await data.union( testPath, tagName, insertTag )
    assert.equal( 8, ( await data.field( testPath, tagName ) ).length )

    console.log( ">> splice" )
    await data.splice( testPath, tagName, "eu" )
    assert.equal( 7, ( await data.field( testPath, tagName ) ).length )

    console.log( ">> push" )
    const endTag = "at-the-end"
    await data.push( testPath, tagName, endTag )
    await data.push( testPath, tagName, endTag )
    await data.push( testPath, tagName, endTag )
    await data.push( testPath, tagName, endTag )
    assert.equal( 11, ( await data.field( testPath, tagName ) ).length )

    console.log( ">> pop" )
    await data.pop( testPath, tagName )
    await data.pop( testPath, tagName )
    await data.pop( testPath, tagName )
    var popped = await data.pop( testPath, tagName )
    assert.equal( popped, endTag )
    assert.equal( 7, ( await data.field( testPath, tagName ) ).length )

    console.log( ">> delete" )
    aboutResult = await data.about( testPath )
    assert.ok( aboutResult.exists )
    await data.delete( testPath )
    aboutResult = await data.about( testPath )
    assert.ok( !aboutResult.exists )

    console.log( ">> query" )
    const docSet = []
    testDoc.forEach( async (doc,index) => {
        docSet[index] = testDocSet + index
        await data.write( docSet[index], doc )
    })
    var queryResult = await data.query( testCollection, "eyeColor", "blue" )
    assert.equal( queryResult.size, 4 )
    queryResult = await data.query( testCollection, "eyeColor", "red" )
    assert.equal( queryResult.size, 0 )
    queryResult = await data.query( testCollection, "age", 28, ">" )
    assert.equal( queryResult.size, 2 )
    docSet.forEach( async (docPath) => {
        await( data.delete( docPath ) )
    })

    return true
}

async function runOne( data, name )
{
    try {
        console.log( `========= firestore.${name} =========` )
        await testallFunctions( data )
    }
    catch (error) {
        errorCount++
        console.error( error )
    }
}

async function testall()
{
    await runOne( firestore.doc, "doc" )
    await runOne( firestore.app, "app" )
    await runOne( firestore.public, "public" )
    return errorCount
}

module.exports = {
    testall: testall
}


