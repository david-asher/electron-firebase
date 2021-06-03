/* localsecrets.js
 * Copyright (c) 2021 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Functions that use encrypted storage to save secrets in the main node.js process. 
 * @module secrets
 */

const estoreModule = require('electron-store')

// this will be our encrypted local storage
var estore = null

// the context for storing the encryption key in our keychain
const appContext = `${process.env.npm_package_name}_${process.env.USER}`

/**
 * Generates a random string suitable for use as an encryption key. 
 * @param {string} byteLength - The number of bytes in the random binary sequence, defaults to 32
 * @param {string} outputFormat - The format for presenting the key, may be 'hex' or 'base64' (default)
 * @alias module:secrets
 */
async function getCryptoKey( byteLength, outputFormat )
{
    const { randomBytes } = await import('crypto')
    return randomBytes( byteLength || 32 ).toString( outputFormat || 'base64' )
}

async function _getIdempotentCryptoKey( byteLength )
{
    // the machine ID will be a unique string that is always the same for,
    // you guessed it, this machine. 64 chars
    const { machineIdSync } = require('node-machine-id')
    const appMachine = machineIdSync()

    // on macOS the passwords are managed by the Keychain, 
    // on Linux they are managed by the Secret Service API/libsecret, 
    // and on Windows they are managed by Credential Vault.
    const keytar = require('keytar')
    const savedKey = await keytar.getPassword( appContext, appMachine )

    // if there is a valid key, don't ever rewrite it else data will be lost
    if ( savedKey ) return savedKey
    
    // which means the following should only execute the first time 
    // the app is run, and nevermore. Thus quoth the raven.
    const cryptoKey = await getCryptoKey( byteLength )
    await keytar.setPassword( appContext, appMachine, cryptoKey )
    return cryptoKey
}

/**
 * If the app is going to be uninstalled, call this function to remove our encryption key. 
 * @alias module:secrets
 */
async function cleanupSecretStore()
{
    const keytar = require('keytar')
    const passwordList = keytar.findCredentials( appContext )
    await passwordList.forEach( async (account) => {
        await keytar.deletePassword( appContext, account )
    })
}

async function _checkStoreSafe()
{
    // checks if the electron-store is initialized yet
    if ( estore ) return

    // secretKey will always be the same on this installation. Had better be.
    const secretKey = await _getIdempotentCryptoKey()

    // the store must be initialized with an encryption key, in which case it
    // creates a local binary file that no one else can read
    estore = new estoreModule({
        name: appContext,
        encryptionKey: secretKey
    })
}

/**
 * When passed a key name and value, will add that key to the secrets store, or update that 
 * key's value if it already exists. 
 * @param {*} key - The name of the key you want to create/update
 * @param {*} value - The value you want to give the key you are creating/updating
 * @alias module:secrets
 */
async function setSecret( key, value ) 
{
    await _checkStoreSafe()
    estore.set( key, value ) 
}

/**
 * When passed a key name, will remove that key from the secrets store if it exists. If there 
 * is no item associated with the given key, this function will do nothing. 
 * @param {string} key - The name of the key you want to remove
 * @alias module:secrets
 */
async function removeSecret( key )
{
    await _checkStoreSafe()
    estore.delete( key ) 
}

/**
 * When passed a key name, will return that key's value if it exists in the secrets store, or null if the key does not exist.
 * @param {string} key - The name of the key you want to retrieve the value of
 * @returns {Promise<string|object>} A promise which resolves to containing the value of the key. If the key does not exist, null is returned.
 * @alias module:secrets
 */
async function getSecret( key )
{
    await _checkStoreSafe()
    return estore.get( key, null )
}

module.exports = {
    setSecret: setSecret,
    getSecret: getSecret,
    removeSecret: removeSecret,
    getCryptoKey: getCryptoKey,
    cleanupSecretStore: cleanupSecretStore
}
