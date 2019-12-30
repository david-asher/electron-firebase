/* firestore.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Interface to Google Cloud Firestore Database. All Firestore document I/O is performed in the 
 * security context of the logged-in user.
 * This data module manages a default set of root-level 
 * collections: data.files, data.docs, data.apps, which are used to keep track of Cloud Storage files, 
 * Firestore document sets, and registered electron apps. 
 * @example <caption>To enable user-level security, go to the Firebase console and set the database rules to the following.</caption>
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId} {
 *       allow create, read, update, delete: if request.auth.uid == userId;
 *     }
 *     match /users/{userId}/{document=**} {
 *       allow create, read, update, delete: if request.auth.uid == userId;
 *     }
 *   }
 * }
 * @see {@link https://firebase.google.com/docs/firestore/security/rules-conditions#authentication|Firestore Authentication}
 * @see {@link https://firebase.google.com/docs/reference/rules/rules.firestore|Firestore Rules}
 * @module data
 */

const authn = require( './authentication' )

const setMergeFields = { merge: true }
const setCreateFields = { merge: false }
const getSnaphotOptions = { serverTimestamps: "previous" }
const baseCollectionSetName = "collections"
const baseUsersCollectionName = "users"
const collectionSet = {
    files: "files",
    docs: "docs",
    apps: "apps"
}

// persistent variables used by firestore.js
var userId = null
var docRoot = null

function _catchHandler( error )
{
    return Promise.reject( error )
}

function _getOptions( optionalSourceFromServer )
{
    return { source: optionalSourceFromServer ? "server" : "default" }
}

/**
 * The setup() function must be called before any other API call in this module.
 * @param {User} user - Object returned from authentication module which describes a user
 * @param {boolean} [bForceUpdate] - If true, any new information in the User object will be merged into the root user Firestore document
 * @returns {object} The Firestore document that represent this user
 * @alias module:data
 */
async function setup( user, bForceUpdate )
{
    const db = authn.firestore()

    // persistent state
    userId = user.uid || null
    if ( !userId ) return Promise.reject( "Invalid user identity at firebase setup" )
    docRoot = db.collection( baseUsersCollectionName ).doc( userId )

    // get the one base document that represents this specific user
    return docRoot.get( _getOptions( true ) )
    .then( async (snap) => {
        var docData = snap.data()
        // create or re-write all of the user structure if it isn't there or asked to force update
        if ( bForceUpdate || docData === undefined ) docData = await _buildUserDocSet( user )
        return docData
    })
    .catch( _catchHandler )
}

/**
 * Returns a DocumentReference that can be used with Firestore APIs. If no path is specified, an 
 * automatically-generated unique ID will be used for the returned DocumentReference.
 * @param {string} rootCollection - The name of a root-level collection set
 * @param {string} [docPath] - Relative path to a Firebase document within the root collection
 * @returns {DocumentReference} Object that can be used to refer to the specified document
 * @see {@link https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference|DocumentReference}
 * @alias module:data
 */
function docRef( rootCollection, docPath )
{
    // docPath can be null or undefined, an auto-generated unique ID will be created
    if ( !docPath ) {
        return docRoot.collection( rootCollection ).doc()
    }
    return docRoot.collection( rootCollection ).doc( docPath )
}

/**
 * Creates a new document in the Firestore at the requested path.
 * @param {string} rootCollection - The name of a root-level collection set
 * @param {string} docPath - Relative path to a Firebase document within the root collection
 * @param {object} contents - Content to write
 * @returns {Promise<DocumentReference>} A DocumentReference to the new Firestore document
 * @see {@link https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#set|DocumentReference set()}
 * @alias module:data
 */
async function docCreate( rootCollection, docPath, contents )
{
    const ref = docRef( rootCollection, docPath )
    await ref.set( contents, setCreateFields )
    return ref
}

/**
 * Reads the Firestore document at the requested path and returns an object representing the content.
 * @param {string} rootCollection - The name of a root-level collection set
 * @param {string} docPath - Relative path to a Firebase document within the root collection
 * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud instead of the local cache
 * @returns {Promise<object>} The contents of the requested document
 * @alias module:data
 */
async function docRead( rootCollection, docPath, bGetFromServer )
{
    return docRef( rootCollection, docPath )
    .get( _getOptions( bGetFromServer ) )
    .then( async (snap) => {
        return snap.data( getSnaphotOptions )
    })
    .catch( _catchHandler )
}

/**
 * Gets the value at a specified field within a Firestore document. 
 * @param {string} rootCollection - The name of a root-level collection set
 * @param {string} docPath - Relative path to a Firebase document within the root collection
 * @param {string} fieldName - The name of a top-level field within the Firebase document
 * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud instead of the local cache
 * @returns {Promise<any>} The data at the specified field location or undefined if no such field exists in the document
 * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot#get|DocumentSnapshot get()}
 * @alias module:data
 */
async function docGetField( rootCollection, docPath, fieldName, bGetFromServer )
{
    return docRef( rootCollection, docPath ).get( _getOptions( bGetFromServer ) )
    .then( async (docSnapshot) => {
        return await docSnapshot.get( fieldName )
    })
    .catch( _catchHandler )
}

/**
 * Gets a DocumentSnapshot for the Firestore document which contains meta information and functions
 * to get data, test existence, etc. 
 * @param {string} rootCollection - The name of a root-level collection set
 * @param {string} docPath - Relative path to a Firebase document within the root collection
 * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud instead of the local cache
 * @returns {Promise<DocumentSnapshot>} An object which can be used to get further information and data
 * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot|DocumentSnapshot}
 * @alias module:data
 */
async function docAbout( rootCollection, docPath, bGetFromServer )
{
    // returns a promise containing a DocumentSnapshot, 
    // which contains properties: exists, id, metadata; and methods get(), data(), isEqual()
    return docRef( rootCollection, docPath ).get( _getOptions( bGetFromServer ) )
}

/**
 * Updates the content to an existing Firestore document, merging and overwriting fields.
 * @param {string} rootCollection - The name of a root-level collection set
 * @param {string} docPath - Relative path to a Firebase document within the root collection
 * @param {object} contents - Content to update
 * @returns {Promise<DocumentReference>} A DocumentReference to the updated Firestore document
 * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentReference#set|DocumentReference set()}
 * @alias module:data
 */
async function docUpdate( rootCollection, docPath, contents )
{
    const ref = docRef( rootCollection, docPath )
    await ref.set( contents, setMergeFields )
    return ref
}

/**
 * Deletes the Firestore document
 * @param {string} rootCollection - The name of a root-level collection set
 * @param {string} docPath - Relative path to a Firebase document within the root collection
 * @returns {Promise<void>} Returns a promise that resolves once the document is deleted
 * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentReference#delete|DocumentReference delete()}
 * @alias module:data
 */
async function docDelete( rootCollection, docPath )
{
    return docRef( rootCollection, docPath ).delete()
}

/**
 * Queries a collection of documents to find a match for a specific field name with optional matching operator.
 * @param {string} rootCollection - The name of a root-level collection
 * @param {string} fieldName - The name of a document field to search against all of the collection documents
 * @param {string} fieldMatch - The value of the fieldName to match against
 * @param {string} [matchOperator] - Optional comparison operator, defaults to "=="
 * @returns {Promise<QuerySnapshot>} 
 * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.Query#where|Query where()}
 * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.QuerySnapshot|QuerySnapshot}
 * @alias module:data
 */
async function docFind( rootCollection, fieldName, fieldMatch, matchOperator )
{
    if ( !matchOperator ) matchOperator = "=="
    return docRoot.collection( rootCollection ).where( fieldName, matchOperator, fieldMatch ).get()
}

/**
 * This function will push a new value onto an array field of the Firestore document. The document 
 * only updates if the new value doesn't exist in the array. Don't use this function for array values
 * that are complex objects. 
 * @param {DocumentReference} docRef - Reference to the document to be updated
 * @param {string} arrayName - The name of the array field to be updated
 * @param {*} newValue - The new value to push on the array field
 * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud before updating the array field
 * @returns {Promise<array>} The updated array field
 * @alias module:data
 */
async function updateArrayElement( docRef, arrayName, newValue, bGetFromServer )
{
    return docRef.get( _getOptions( bGetFromServer ) )
    .then( async (snap) => {
        var baseDoc = snap.data()
        var arrayRef = baseDoc[ arrayName ]
        if ( !arrayRef ) arrayRef = baseDoc[ arrayName ] = []
        if ( arrayRef.indexOf( newValue ) < 0 ) {
            arrayRef.push( newValue )
            await docRef.set( baseDoc, setMergeFields )
        }
        return arrayRef
    })
    .catch( _catchHandler )
}

/**
 * This function will remove a value from an array field of the Firestore document. The document 
 * only updates if the old value existed in the array. Don't use this function for array values
 * that are complex objects. 
 * @param {DocumentReference} docRef - Reference to the document to be updated
 * @param {string} arrayName - The name of the array field to be updated
 * @param {*} oldValue - The old value to be removed from the array field
 * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud before updating the array field
 * @returns {Promise<array>} The updated array field
 * @alias module:data
 */
async function removeArrayElement( docRef, arrayName, oldValue, bGetFromServer )
{
    return docRoot.get( _getOptions( bGetFromServer ) )
    .then( async (snap) => {
        var baseDoc = snap.data()
        var arrayRef = baseDoc[ arrayName ]
        if ( !arrayRef ) return null
        const found = arrayRef.indexOf( oldValue )
        if ( found > 0 ) 
        {   
            arrayRef.splice( found, 1 )
            await docRef.set( baseDoc, setMergeFields )
        }
        return arrayRef
    })
    .catch( _catchHandler )
}

/**
 * Adds a new collection name to the top-level collection set, which can be used in other APIs 
 * requiring rootCollection.
 * @param {sring} collectionName - The name of a new collection to be added to the top-level set
 * @returns {Promise<array>} The updated set of top-level collections
 * @alias module:data
 */
async function addToRootCollections( collectionName )
{
    return updateArrayElement( docRoot, baseCollectionSetName, collectionName )
}

/**
 * Removes a collection name from the top-level collection set.
 * @param {sring} collectionName - The name of a collection to be removed from the top-level set
 * @returns {Promise<array>} The updated set of top-level collections
 * @alias module:data
 */
async function removeFromRootCollections( collectionName )
{
    return removeArrayElement( docRoot, baseCollectionSetName, collectionName, true )
}

/**
 * Returns the list of top-level collections.
 * @returns {Promise<array>} The updated set of top-level collections
 * @alias module:data
 */
async function listRootCollections( bGetFromServer )
{
    return docRoot.get( _getOptions( bGetFromServer ) )
    .then( async (snap) => {
        var baseDoc = snap.data()
        var arrayRef = baseDoc[ baseCollectionSetName ] || []
        return arrayRef
    })
    .catch( _catchHandler )
}

function _makeBaseDocuments( user )
{
    if ( !user || !user.uid || !user.displayName ) {
        return null
    }

    const isNow = ( new Date() ).toISOString()

    // there should be a root document which could contain arrays or subcontainers
    // in the root document, put fields that you want to index for searching across all users
    const root = {
        uid: user.uid,
        name: user.displayName,
        created: user.creationTime || isNow,
        collections: []
    }

    // fixups
    const profile = { ... user.profile }
    if ( !profile.email )        profile.email = user.email || null
    if ( !profile.picture )      profile.picture = user.photoURL || null

    const provider = { ... user.providerData[0] }
    if ( !provider.displayName ) provider.displayName = user.displayName || null
    if ( !provider.email )       provider.displayName = user.email || null
    if ( !provider.phoneNumber ) provider.phoneNumber = user.phoneNumber || null
    if ( !provider.photoURL )    provider.photoURL = user.photoURL || null

    const application = {
        name: global.appContext.name,
        version: global.appContext.appVersion,
        node: global.appContext.nodeVersion,
        chrome: global.appContext.chromeVersion,
        electron: global.appContext.electronVersion
    }

    const account = {
        uid: user.uid,
        name: user.displayName,
        photo: user.photoURL || null,
        email: user.email || null,
        created: user.creationTime || isNow
    }

    const session = {
        apiKey: global.fbConfig.apiKey || null,
        appName: user.appName || null,
        domain: user.authDomain || null,
        last: user.lastSignInTime || isNow
    }

    return {
        root: root,
        application: application,
        profile: profile,
        provider: provider,
        account: account,
        session: session,
    }
}

async function _buildUserDocSet( user )
{
    const baseDocs = _makeBaseDocuments( user )
    if ( !baseDocs ) {
        throw( "invalid user object at buildUserRoot" )
    }

    // create the root document
    await docRoot.set( baseDocs.root, setMergeFields )

    for ( var index in collectionSet ) {
        await addToRootCollections( collectionSet[ index ] )
    }

//    await collectionSet.forEach( async (value, index, array) => {
//        await addToRootCollections( value )
//    })

    // put this application in the apps collection
    await docCreate( collectionSet.apps, baseDocs.application.name, baseDocs.application )

    // create new objects in the documents collection
    await docCreate( collectionSet.docs, "profile",  baseDocs.profile ) 
    await docCreate( collectionSet.docs, "provider", baseDocs.provider ) 
    await docCreate( collectionSet.docs, "account",  baseDocs.account ) 
    await docCreate( collectionSet.docs, "session",  baseDocs.session ) 

    // create the files collection with a first file
    await docCreate( collectionSet.files, "profile", baseDocs.profile )

    return baseDocs.root
}

module.exports = {
    setup: setup,
    updateArrayElement: updateArrayElement,
    removeArrayElement: removeArrayElement,
    listRootCollections: listRootCollections,
    addToRootCollections: addToRootCollections,
    removeFromRootCollections: removeFromRootCollections,
    docRef: docRef,
    docAbout: docAbout,
    docCreate: docCreate,
    docRead: docRead,
    docGetField: docGetField,
    docUpdate: docUpdate,
    docDelete: docDelete,
    docFind: docFind,

    FILES: collectionSet.files,
    DOCS: collectionSet.docs,
    APPS: collectionSet.apps,
    MERGE: setMergeFields,
    CREATE: setCreateFields
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}