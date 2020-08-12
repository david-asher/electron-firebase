/* firestore.js
 * Copyright (c) 2019-2020 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * @module firestore
 * Interface to Google Cloud Firestore Database using high-level interface objects. 
 * All Firestore document I/O is performed in the security context of the 
 * logged-in user and the specific app you have built.
 * 
 * It is important to understand the structure of a Firestore because it is not a file tree. A single 
 * document may contain a set of properties, but not another document. A document may also contain 
 * collections. A collection is a set of documents, but not properties. Therefore a document is always 
 * a member of a collection, and a collection is a member of a document. You can describe a specific 
 * path to a document, and it must always be an even number of path components since the document 
 * parent will be a collection, except for the root document of the Firestore. If you follow only this
 * interface for access to the Firestore, you will not have direct access to the root document.
 * @see {@link https://firebase.google.com/docs/firestore/manage-data/structure-data}
 * @see {@link https://firebase.google.com/docs/firestore/data-model}
 * 
 * Once a firestore object is defined, all document I/O is performed relative to (constrained to)
 * this top-level document, so your code can't wander astray into other parts of the Firestore
 * where you don't belong. Each API starts with a docPath parameter, and if null will refer to the 
 * top-level doc, into which you can read and write fields. If you want to create or work with documents, 
 * the docPath parameter must have an even number of path segments, e.g. "/maps/chicago" in which case
 * the collection "maps" will be automatically created if it doesn't exist. 
 * 
 * After initialization three objects are available from this module:
 * * .doc - A Firestore subtree (/users/<userid>/) for the signed-in user's documents in Firestore
 * * .app - A Firestore subtree (/apps/<projectId>/) for the app being used, accessible to all users
 * * .public - A Firestore subtree (/apps/public/) that any user or app and read or write to 
 */

const authn = require( './authentication' )

// firestoreDoc root collections, for object persistence and internal reference
var fireSet = {}

var fromServer = { source: "default" }

class firestoreDoc
{
    /**
     * @constructs firestore
     * Create a top-level Firestore db/collection/doc/, into which you can segment your Firestore. 
     * @param {string} rootCollectionName - Top level segmentation of your Firestore, e.g. "users"
     * @param {string} topLevelDocument - A specific name (i.e. constraint) for this document tree, e.g. userId
     * @returns {null} 
     */
    constructor( rootCollection, topLevelDocument, scopeName )
    {
        this.name = scopeName,
        this.rootName = rootCollection
        this.topDocName = topLevelDocument
        this.root = authn.firestore().collection( this.rootName )
        this.topdoc = this.root.doc( this.topDocName )
    }

    _ref( docPath )
    {
        var docRef = null
        try {
            // docPath is assumed to be relative to this.topdoc. If it is blank or null it refers to the 
            // top-level document. If it has an odd number of path segments, _ref() creates a new document 
            // with an automatically-generated unique ID.
            const cleanPath = ( docPath || "" ).replace( "//", "/" ).replace( "\\", "/" )
            const parts = ( cleanPath ).split( '/' )
            if ( parts.length === 0 ) {
                return this.topdoc
            }
            // check for an even number of path segments, we have a named document
            const nParts = parts.length
            const docName = parts.pop()
            var collectionName = parts.join( '/' )
            if ( !collectionName || collectionName.length == 0 ) return docRef
            if ( 0 !== ( nParts % 2 ) ) return docRef
            // get the collection, then the doc if there's an even number of path parts
            const collectionRef = this.topdoc.collection( collectionName )
            docRef = collectionRef.doc( docName )
        }
        catch (error) {
            console.error( "firestore.js _ref: ", docPath, error )
        }
        return docRef
    }

    /**
     * @async
     * Gets a DocumentSnapshot for the Firestore document which contains meta information and functions
     * to get data, test existence, etc. 
     * @param {string} docPath - Relative path to a Firebase document within the root collection
     * @returns {Promise<DocumentSnapshot>} An object which can be used to get further information and data
     * about the document: .exists, .id, .metadata, .get(), .data(), .isEqual()
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot|DocumentSnapshot}
     * @alias module:firestore
     */
    async about( docPath )
    {
        // returns a promise containing a DocumentSnapshot, 
        // which contains properties: exists, id, metadata; and methods get(), data(), isEqual()
        return await this._ref( docPath ).get( fromServer )
    }

    /**
     * @async
     * Reads the Firestore document at the requested path and returns an object representing the content. 
     * @param {string} docPath - Path to a Firebase document
     * @returns {Promise<object>} The contents of the requested document
     * @alias module:firestore
     */
    async read( docPath )
    {
        var result = null
        try {
            const readResult = await this.about( docPath )
            if ( readResult && readResult.exists ) result = await readResult.data()
        }
        catch (error) {
            console.log( error )
            throw( error )
            // let it go
        }
        return result
    }

    /**
     * @async
     * Creates a new document in the Firestore at the requested path, else updates an existing document
     * if it already exists, overwriting all fields.
     * @param {string} docPath - Path to a Firebase document 
     * @param {object} [contents] - Content to write into new document, or merge into existing document
     * @returns {Promise<DocumentReference>} DocumentReference for the docPath
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot}
     * @alias module:firestore
     */
    async write( docPath, contents = {} )
    {
        await this._ref( docPath ).set( contents, { merge: false } )
        return await this.about( docPath )
    }

    /**
     * @async
     * Creates a new document in the Firestore at the requested path, else updates an existing document
     * if it already exists, merging all fields.
     * @param {string} docPath - Path to a Firebase document 
     * @param {object} [contents] - Content to write into new document, or merge into existing document
     * @returns {Promise<DocumentReference>} DocumentReference for the docPath
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot}
     * @alias module:firestore
     */
    async merge( docPath, contents = {} )
    {
        await this._ref( docPath ).set( contents, { merge: true } )
        return await this.about( docPath )
    }

    /**
     * @async
     * Updates an existing document in the Firestore at the requested path with the given contents. Like
     * merge() except it will fail if the document does not exist.
     * @param {string} docPath - Path to a Firebase document 
     * @param {object} [contents] - Content to write into new document, or merge into existing document
     * @returns {Promise<DocumentReference>} DocumentReference for the docPath
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot}
     * @alias module:firestore
     */
    async update( docPath, contents = {} )
    {
        /*
         * NOTE: DocumentReference has an update() method that fails if the document doesn't exist, 
         * however in the failure case it simply prints an error message and neither throws nor returns
         * an error, so it's undetectable. So instead we'll check for document existence, and if the doc 
         * doesn't exist return Promise<null> else Promise<DocumentReference>
         */
        var result = null
        result = await this.about( docPath )
        if ( result && result.exists ) await this.merge( docPath, contents )
        return result
    }

    /**
     * @async
     * Deletes the Firestore document at the given path.
     * @param {string} docPath - Path to a Firebase document
     * @returns {Promise<void>} Returns a promise that resolves once the document is deleted
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentReference#delete|DocumentReference delete()}
     * @alias module:firestore
     */
    async delete( docPath )
    {
        return await this._ref( docPath ).delete()
    }

    /**
     * @async
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
    async query( collectionPath, fieldName, fieldMatch, matchOperator = "==" )
    {
        const collectionRef = this.topdoc.collection( collectionPath )
        const resultQuery = await collectionRef.where( fieldName, matchOperator, fieldMatch )
        // note, the .get() call can return almost immediately or take up to 7-8 seconds. Yuk.
        // There seems to be no good explanation on Stackoverflow or elsewhere.
        return await resultQuery.get( { source: "default" } ) 
    }

    /**
     * @async
     * Gets the value of a specified field within a Firestore document. 
     * @param {string} docPath - Path to a Firebase document
     * @param {string} fieldName - The name of a top-level field within the Firebase document
     * @returns {Promise<any>} The data at the specified field location or undefined if no such field exists in the document
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot#get|DocumentSnapshot get()}
     * @alias module:firestore
     */
    async field( docPath, fieldName )
    {
        const docRef = this._ref( docPath )
        const snap = await docRef.get( fromServer )
        return await snap.get( fieldName )
    }

    /**
     * @async
     * This function will insert a new value, or multiple values, onto an array field of the 
     * Firestore document. Each specified element that doesn't already exist in the array will 
     * be added to the end. If the field being modified is not already an array it will be 
     * overwritten with an array containing exactly the specified elements.
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @param {*} newValue - The new value to push on the array field
     * @returns {Promise<array>} - The array after the new value is inserted
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.FieldValue#static-arrayunion|FieldValue union}
     * @alias module:firestore
     */
    async union( docPath, arrayName, newValue )
    {
        const updateElement = {}
        updateElement[ arrayName ] = authn.FieldValue.arrayUnion( newValue )
        await this._ref( docPath ).update( updateElement )
        return await this.field( docPath, arrayName )
    }

    /**
     * @async
     * This function will remove a value, or multiple values, from an array field of the 
     * Firestore document.  
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @param {*} newValue - The new value to push on the array field
     * @returns {Promise<array>} - The array after the value is removed
     * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.FieldValue#static-arrayremove|FieldValue remove}
     * @alias module:firestore
     */
    async splice( docPath, arrayName, oldValue )
    {
        const updateElement = {}
        updateElement[ arrayName ] = authn.FieldValue.arrayRemove( oldValue )
        await this._ref( docPath ).update( updateElement )
        return await this.field( docPath, arrayName )
    }

    /**
     * @async
     * This function will push a new value onto the end of an array field of the Firestore document. 
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @param {*} newValue - The new value to push on the array field
     * @returns {Promise<array>} The updated array field
     * @alias module:firestore
     */
    async push( docPath, arrayName, newValue )
    {
        const docRef = this._ref( docPath )
        const snap = await docRef.get( fromServer )
        var baseDoc = snap.data()
        var arrayRef = baseDoc[ arrayName ]
        if ( !arrayRef ) arrayRef = baseDoc[ arrayName ] = []
        arrayRef.push( newValue )
        await docRef.set( baseDoc, { merge: true } )
        return arrayRef
    }

    /**
     * @async
     * This function will pop a value from the end of an array field of the Firestore document. 
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @returns {Promise<string|number|object>} The popped value
     * @alias module:firestore
     */
    async pop( docPath, arrayName )
    {
        var popped = null
        const docRef = this._ref( docPath )
        const snap = await docRef.get( fromServer )
        var baseDoc = snap.data()
        var arrayRef = baseDoc[ arrayName ]
        if ( arrayRef ) popped = arrayRef.pop()
        await docRef.set( baseDoc, { merge: true } )
        return popped
    }
}

/**
 * Firestore interfaces are defined when your app starts:
 * * .doc - A Firestore subtree (/users/userid/) for the signed-in user's documents in Firestore
 * * .app - A Firestore subtree (/apps/projectId/) for the app being used, accessible to all users
 * * .public - A Firestore subtree (/apps/public/) that any user or app and read or write to 
 *  
 * @param {string} userid - The Firebase assigned userId from authentication process
 * @param {string} projectId - Unique string for this application, typically the Firebase projectId
 * @alias module:firestore
 */
function initialize( userid, projectId )
{
    fireSet.doc    = new firestoreDoc( "users", userid, "doc" )
    fireSet.app    = new firestoreDoc( "apps", projectId, "app" )
    fireSet.public = new firestoreDoc( "apps", "public", "public" )
    Object.assign( module.exports, fireSet )
}

module.exports = {
    initialize: initialize
}
