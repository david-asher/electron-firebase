// test_template.js
'use strict';

const assert = require('assert').strict
const { BrowserWindow } = require('electron')

// module under test:
const { applib } = require('../electron-firebase')

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
    // 
    assert( /* something-is-true */ )
    
    return true
}

module.exports = {
    // target: () => { return \MODULE\.modulename() },
    testall: testall
}


