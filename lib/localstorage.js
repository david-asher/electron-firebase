/* localstorage.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Functions that use the localStorage capability in a BrowserWindow to store persistent information. These APIs
 * run in the main node.js process and use IPC to request and transfer information from the browser. This
 * feature is used in conjunction with the weblocal.js file if referenced by a BrowserWindow. weblocal.js should
 * not be loaded into more than one BrowserWindow. This API is intended to mimic the localStorage API available in 
 * every Browser, except the getItem() call must be asynchronous and replies with either a callback or a promise.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage|localStorage}
 * @module local
 */

/*
 * Pub-style messaging from the main process to the browser window.
 * @param {string} topic - A topic that you expect the browser to be subscribed to
 * @param {string} key - A storage or command key
 * @param {string|object} value - The content of the message
 */
function _send( topic, key, value )
{
    try {
        // accessing the .id property is a way to check if the window exists so we don't hang or crash
        const bad = global.mainWindow.id
        global.mainWindow.webContents.send( "localStorage", topic, key, value )
        return { topic: topic, key: key, value: value }
    }
    catch (error) {
        console.error( "webContents.send error on " + key + ", " + value )
        return { error: error }
    }
}

/*
 * Sub-style messaging from the browser window to the main process.
 * @param {string} topic - A topic to receive a message from 
 */
async function _receive( topic )
{
    return new Promise( (resolve,reject) => {
        if ( !global.mainIPC ) return reject(0)
        global.mainIPC.once( topic, ( event, value ) => {
            try {
                value = JSON.parse( value )
            }
            catch (error) {
                // leave the original value
            }
            resolve( value )
        })
    })
}

/**
 * When passed a key name and value, will add that key to the Storage object, or update that 
 * key's value if it already exists. This function will not confirm that the key and value
 * were written to the BrowserWindow localStorage.
 * @param {*} key - The name of the key you want to create/update
 * @param {*} value - The value you want to give the key you are creating/updating
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem|localStorage setItem()}
 * @alias module:local
 */
function setItem( key, value ) 
{
    if ( value && typeof value == 'object' ) {
        try {
            value = JSON.stringify( value )
        }
        catch (error) {
            console.error( "setItem: ", key, value, error )
        }
    }
    _send( "setItem", key, value )
}

/**
 * When passed a key name, will remove that key from the Storage object if it exists. If there 
 * is no item associated with the given key, this function will do nothing. 
 * @param {string} key - The name of the key you want to remove
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Storage/removeItem|localStorage removeItem()}
 * @alias module:local
 */
function removeItem( key )
{
    _send( "removeItem", key, null )
}

/**
 * When passed a key name, will return that key's value, or null if the key does not exist.
 * @param {string} key - The name of the key you want to retrieve the value of
 * @param {*} [optionalCallback] - Optional callback function to retreive the 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem|localStorage getItem()}
 * @returns {Promise<string|object>} A promise which resolves to containing the value of the key. If the key does not exist, null is returned.
 * @alias module:local
 */
function getItem( key, optionalCallback )
{
   var failTimer
   return new Promise( (resolve,reject) => {
        // we can't get from localStorage if there is no IPC 
        if ( !global.mainIPC ) {
            if ( optionalCallback ) optionalCallback( null )
            resolve( null )
            return 
            
        }
        _receive( "localStorage:" + key )
        .then( (value) => {
            if ( failTimer ) clearTimeout( failTimer )
            failTimer = null
            if ( optionalCallback ) optionalCallback( value )
            resolve( value )
        })
        .catch( (error) => {
            if ( optionalCallback ) optionalCallback( null )
            reject( error )
        })
        failTimer = setTimeout( () => {
            failTimer = null
            console.error( "Timeout on getItem for " + key )
            resolve( null )
        }, 4000 )
        _send( "getItem", key, null )
    })
}

module.exports = {
    setItem: setItem,
    removeItem: removeItem,
    getItem: getItem
}
