// test_localstorage.js
'use strict';

const assert = require('assert').strict
const { ipcMain } = require('electron')

// module under test:
const { window, local } = require('../electron-firebase')

// specimens
const jsonDoc = global.readFile( global.testDocPath )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]
const testPageUrl = `file://${__dirname}/testpage_local.html`
const webapp = global.appConfig.webapp
const openOptions = {
    show: false,
    width: webapp.firstWidth, 
    height: webapp.firstHeight,
    title: "LocalStoragePage",
    webPreferences: {
        nodeIntegration: true 
    }
}
const testKey = "testKey"
const testValue = "testValueForKey"

function _catchHandler( error )
{
    return Promise.reject( error )
}

async function testall()
{
    // note: send() and receive() are tested within the getItem and setItem functions

    // openWindow( urlToOpen, setOptions, readyCallback ) 
    console.log( ">> openWindow" )
    const testWindow = new window.open( testPageUrl, openOptions )  
    
    await testWindow.waitForShow()
    .then( async () => {
        local.setup( testWindow, ipcMain )
        testWindow.show()
    })
    .catch( _catchHandler )

    // setItem( key, value ) 
    console.log( ">> setItem" )
    local.setItem( testKey, testValue )

    // getItem( key, optionalCallback )
    console.log( ">> getItem" )
    await local.getItem( testKey )
    .then( async (value) => {
        assert.equal( value, testValue )
    })
    .catch( _catchHandler )

    // removeItem( key )
    console.log( ">> removeItem" )
    local.removeItem( testKey )
    await local.getItem( testKey )
    .then( async (value) => {
        assert.equal( value, null )
    })
    .catch( _catchHandler )

    /**
     * We'll hide the test window but not close it. You want an explanation, don't you?
     * Closing the window will raise some calamitous error that causes the test app
     * to stop, like a process exit, however no error is thrown, at least at JavaScript
     * level, so there's no way to detect exactly where the fault is. The windows will 
     * all be closed when the test app exits, so no harm, it's just that there should be
     * no reason for this not to work, we really should close the window.
     */

    // cleanup
    testWindow.hide()
//    console.log( ">> closeWindow" )
//    testWindow.close()
//    testWindow.waitForClose()

    return true
}

module.exports = {
    target: () => { return local.modulename() },
    testall: testall
}


