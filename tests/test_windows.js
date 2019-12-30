// test_windows.js
'use strict';

const assert = require('assert').strict

// module under test:
const { window, local } = require('../electron-firebase')
const { BrowserWindow, ipcMain, dialog } = require('electron')

// specimens
const jsonDoc = global.readFile( global.testDocPath )
const testDoc = JSON.parse( jsonDoc )
const testObj = testDoc[0]

function _catchHandler( error )
{
    console.error( error )
    return Promise.reject( error )
}

const setNewBounds = { x: 440, y: 225, width: 800, height: 600 }
const webapp = global.appConfig.webapp
const testPageUrl = `file://${__dirname}/testpage_windows.html`
const openOptions = {
    show: false,
    postShow: true,
    width: webapp.firstWidth, 
    height: webapp.firstHeight,
    title: "TestWindowPage",
    webPreferences: {
        nodeIntegration: true 
    }
}

function waitForShow( window )
{
    return new Promise( (resolve, reject) => 
    {
        window.on( 'show', () => {
            resolve( true )
        })
    })
}

async function testall()
{
    // openWindow( urlToOpen, setOptions ) 
    console.log( ">> openWindow" )
    const testWindow = new window.open( testPageUrl, openOptions )

    await testWindow.waitForShow()
    .then( async () => {
        local.setup( testWindow, ipcMain )
        testWindow.show()
    })
    .catch( _catchHandler )

    await waitForShow( testWindow )

    // prove that it's a window
    assert( testWindow.isVisible() )
    assert.equal( testWindow.getTitle(), "Test Webpage - Windows" )
    testWindow.setBounds( setNewBounds )
    assert.deepEqual( setNewBounds, testWindow.getBounds() )

    // cleanup
    testWindow.hide()
    
    /*
     * We'll hide the test window but not close it. You want an explanation, don't you?
     * Closing the window will raise some calamitous error that causes the test app
     * to stop, like a process exit, however no error is thrown, at least at JavaScript
     * level, so there's no way to detect exactly where the fault is. The windows will 
     * all be closed when the test app exits, so no harm, it's just that there should be
     * no reason for this not to work, we really should close the window.
     */
//    console.log( ">> close" )
//    testWindow.close()
//    await testWindow.waitForClose()

    return true
}

module.exports = {
    target: () => { return window.modulename() },
    testall: testall
}


