/* firestore.js
 * Copyright (c) 2020 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Interface to Google Cloud Firestore Database using high-level interface objects defined 
 * in firestore.js. All Firestore document I/O is performed in the security context of the 
 * logged-in user and the specific app you have built.
 * 
 * Three Firestore interfaces are defined when your app starts:
 * * myDocs - A specific Fisrestore subtree for the signed-in user, and no other user
 * * myApps - A specific Firestore subtree for the app being used, and no other app
 * * global - Truly shared information accessible to all users and apps
 * 
 * Note that myAppsBase is specific to apps but not specific to users. If you need to have app-specific
 * information held only in the context of a user, that should be put in an "apps" collection under 
 * myDocsBase. Documents under myAppsBase are accessible to all users, but within an app context.
 * 
 * It is important to understand the structure of a Firestore because it is not a file tree. A single 
 * document may contain a set of properties, but not another document. A document may also contain 
 * collections. A collection is a set of documents, but not properties. Therefore a document is always 
 * a member of a collection, and a collection is a member of a document. You can describe a specific 
 * path to a document, and it must always be an even number of path components since the document 
 * parent will be a collection, except for the root document of the Firestore. If you follow only this
 * interface for access to the Firestore, you will not have direct access to the root document.
 * @see {@link https://firebase.google.com/docs/firestore/data-model}
 * 
 * Once a firestore object is defined, all document I/O is performed relative to (constrained to)
 * this top-level document, so your code can't wander astray into other parts of the Firestore
 * where you don't belong. Each API starts with a docPath parameter, and if null will refer to the 
 * top-level doc, into which you can read and write fields. If you want to create or work with documents, 
 * the docPath parameter must have an even number of path segments, e.g. "/maps/chicago" in which case
 * the collection "maps" will be automatically created. 
 * 
 * @example <caption>To enable user-level security (which you really, really want to do), 
 * go to the Firebase console and set the database rules to the following.</caption>
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId} {
 *       allow create, read, update, delete: if request.auth.uid == userId;
 *     }
 *     match /users/{userId}/{document=**} {
 *       allow create, read, update, delete: if request.auth.uid == userId;
 *     }
 *     match /apps/{appId} {
 *       allow create, read, update, delete: if request.auth.token.appId == appId;
 *     }
 *     match /apps/{appId}/{document=**} {
 *       allow create, read, update, delete: if request.auth.token.appId == appId;
 *     }
 *   }
 * }
 * @see {@link https://firebase.google.com/docs/firestore/security/rules-conditions#authentication|Firestore Authentication}
 * @see {@link https://firebase.google.com/docs/reference/rules/rules.firestore|Firestore Rules}
 * @module firestore
 */

const authn = require( './authentication' )

const setMergeFields = { merge: true }
const setCreateFields = { merge: false }
const getSnaphotOptions = { serverTimestamps: "previous" }

// firestoreDoc root collections

const eachUserCollection    = "users"
const eachAppCollection     = "apps"
const globalDocCollection   = "global"

var fireSet = {}

class firestoreDoc
{
    /**
     * Create a top-level Firestore db/collection/doc/, into which you can segment your Firestore. 
     * @param {string} rootCollectionName - Top level segmentation of your Firestore, e.g. "users"
     * @param {string} topLevelDocument - A specific name (i.e. constraint) for this document tree, e.g. userId
     * @returns {null} 
     */
    constructor( rootCollection, topLevelDocument )
    {
        this.rootName = rootCollection
        this.topDocName = topLevelDocument
        this.root = authn.firestore().collection( this.rootName )
        this.topdoc = this.root.doc( this.topDocName )
    }

    _fromServer( optionalSourceFromServer )
    {
        return { source: optionalSourceFromServer ? "server" : "default" }
    }

    _catchHandler( error )
    {
        return Promise.reject( error )
    }

    _ref( docPath )
    {
        // docPath is assumed to be relative to this.topdoc. If it is blank or null it refers to the 
        // top-level document. If it has an odd number of path segments, _ref() creates a new document 
        // with an automatically-generated unique ID.
        const parts = ( docPath || "" ).split( '/' )
        if ( parts.length === 0 ) {
            return this.topdoc
        }
        // check for an even number of path segments, we have a named document
        if ( parts.length % 2 === 0 ) {
            const docName = parts.pop()
            const collectionName = parts.join( '/' )
            return this.topdoc.collection( collectionName ).doc( docName )
        }
        // this case is an unnamed document
        return this.topdoc.collection( docPath ).doc()
    }

    /**
     * Gets a DocumentSnapshot for the Firestore document which contains meta information and functions
     * to get data, test existence, etc. 
     * @param {string} docPath - Relative path to a Firebase document within the root collection
     * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud instead of the local cache
     * @returns {Promise<DocumentSnapshot>} An object which can be used to get further information and data
     * about the document: .exists, .id, .metadata, .get(), .data(), .isEqual()
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot|DocumentSnapshot}
     * @alias module:firestore
     */
    async about( docPath, bGetFromServer = false )
    {
        // returns a promise containing a DocumentSnapshot, 
        // which contains properties: exists, id, metadata; and methods get(), data(), isEqual()
        return this._ref( docPath ).get( this._fromServer( bGetFromServer ) )
    }

    /**
     * Creates a new document in the Firestore at the requested path, else updates an existing document
     * if it already exists, merging all fields.
     * @param {string} docPath - Path to a Firebase document 
     * @param {object} [contents] - Content to write into new document, or merge into existing document
     * @returns {Promise<DocumentReference>} A DocumentReference to the new Firestore document
     * @see {@link https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#set|DocumentReference set()}
     * @alias module:firestore
     */
    async write( docPath, contents = {} )
    {
        const ref = this._ref( docPath )
        var snap = await ref.get( this._fromServer( true ) )
        await ref.set( contents, snap.exists ? setMergeFields : setCreateFields )
        return ref
    }

    /**
     * Reads the Firestore document at the requested path and returns an object representing the content.
     * @param {string} docPath - Path to a Firebase document
     * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud instead of the local cache
     * @returns {Promise<object>} The contents of the requested document
     * @alias module:firestore
     */
    async read( docPath, bGetFromServer = false )
    {
        return this._ref( docPath )
        .get( this._fromServer( bGetFromServer ) )
        .then( async (snap) => {
            return await snap.data( getSnaphotOptions )
        })
        .catch( this._catchHandler )
    }

    /**
     * Gets the value of a specified field within a Firestore document. 
     * @param {string} docPath - Path to a Firebase document
     * @param {string} fieldName - The name of a top-level field within the Firebase document
     * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud instead of the local cache
     * @returns {Promise<any>} The data at the specified field location or undefined if no such field exists in the document
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot#get|DocumentSnapshot get()}
     * @alias module:firestore
     */
    async field( docPath, fieldName, bGetFromServer = false )
    {
        return this._ref( docPath )
        .get( this._fromServer( bGetFromServer ) )
        .then( async (docSnapshot) => {
            return await docSnapshot.get( fieldName )
        })
        .catch( this._catchHandler )
    }

    /**
     * Deletes the Firestore document at the given path.
     * @param {string} docPath - Path to a Firebase document
     * @returns {Promise<void>} Returns a promise that resolves once the document is deleted
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentReference#delete|DocumentReference delete()}
     * @alias module:firestore
     */
    async delete( docPath )
    {
        return this._ref( docPath ).delete()
    }

    /**
     * Queries a collection to find a match for a specific field name with optional matching operator.
     * @param {string} collectionPath - The path to a collection, cannot be blank
     * @param {string} fieldName - The name of a document field to search against all of the collection documents
     * @param {string} fieldMatch - The value of the fieldName to match against
     * @param {string} [matchOperator] - Optional comparison operator, defaults to "=="
     * @returns {Promise<QuerySnapshot>} 
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.Query#where|Query where()}
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.QuerySnapshot|QuerySnapshot}
     * @alias module:firestore
     */
    async find( collectionPath, fieldName, fieldMatch, matchOperator = "==" )
    {
        return this.topdoc.collection( collectionPath ).where( fieldName, matchOperator, fieldMatch ).get()
    }

    /**
     * This function will push a new value onto an array field of the Firestore document. The document 
     * only updates if the new value doesn't exist in the array. Don't use this function for array values
     * that are complex objects. 
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @param {*} newValue - The new value to push on the array field
     * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud before updating the array field
     * @returns {Promise<array>} The updated array field
     * @alias module:firestore
     */
    async append( docPath, arrayName, newValue, bGetFromServer = false )
    {
        const docRef = this._ref( docPath )
        return docRef.get( this._fromServer( bGetFromServer ) )
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
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @param {*} oldValue - The old value to be removed from the array field
     * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud before updating the array field
     * @returns {Promise<array>} The updated array field
     * @alias module:firestore
     */
    async splice( docPath, arrayName, oldValue, bGetFromServer = false )
    {
        const docRef = this._ref( docPath )
        return docRef.get( this._fromServer( bGetFromServer ) )
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
}

function initialize( userid, appid )
{
    fireSet[ eachUserCollection ] = new firestoreDoc( eachUserCollection, userid )
    fireSet[ eachAppCollection ] = new firestoreDoc( eachAppCollection, appid )
    fireSet[ globalDocCollection ] = new firestoreDoc( globalDocCollection, globalDocCollection )
    module.exports.docs  = fireSet[ eachUserCollection ]
    module.exports.apps  = fireSet[ eachAppCollection ]
    module.exports.global = fireSet[ globalDocCollection ]
}

module.exports = {
    initialize: initialize
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}