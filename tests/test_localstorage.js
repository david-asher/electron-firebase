// test_localstorage.js
'use strict';

const assert = require('assert').strict

// module under test:
const { local } = require('../electron-firebase')

// specimens
const testKey = "testKey"
const testValue = {
    one: "first item",
    two: "second item"
}

var errorCount = 0

async function testallFunctions()
{
    // setItem( key, value ) 
    console.log( ">> setItem" )
    local.setItem( testKey, testValue )

    console.log( ">> getItem" )
    const getValue = await local.getItem( testKey )
    assert.deepEqual( getValue, testValue )

    // removeItem( key )
    console.log( ">> removeItem" )
    local.removeItem( testKey )
    const removeValue = await local.getItem( testKey )
    assert.equal( removeValue, null )
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


