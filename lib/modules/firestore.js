/* firestore.js
 * Copyright (c) 2020 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Interface to Google Cloud Firestore Database using high-level interface objects defined 
 * in firestore.js. All Firestore document I/O is performed in the security context of the 
 * logged-in user and the specific app you have built.
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
 * @see {@link https://firebase.google.com/docs/firestore/manage-data/structure-data}
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
 * 
 *  service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId}/{allPaths=**} {
 *       allow create, read, update, delete: if request.auth.uid == userId;
 *     }
 *     match /apps/{projectId}/{allPaths=**} {
 *       allow create, read, update, delete: if request.auth != null && request.auth.token.aud == projectId;
 *     }
 *     match /apps/public/{allPaths=**} {
 *       allow create, update, delete: if request.auth != null
 *       allow read: if true
 *     }
 *   }
 * }
 * 
 * @see {@link https://firebase.google.com/docs/firestore/security/rules-conditions#authentication|Firestore Authentication}
 * @see {@link https://firebase.google.com/docs/reference/rules/rules.firestore|Firestore Rules}
 * @module firestore
 */

const authn = require( './authentication' )

// parameters for making Firebase API calls
const setMergeFields = { merge: true }
const setCreateFields = { merge: false }
const snapshotOptions = { serverTimestamps: "previous" }

// firestoreDoc root collections, for object persistence and internal reference
var fireSet = {}

function waitFor( timeDelay ) 
{
    return new Promise( (resolve) => setTimeout( resolve, timeDelay ) );
}

function fromServer( optionalSourceFromServer )
{
    return { source: optionalSourceFromServer ? "server" : "default" }
}


class firestoreDoc
{
    /**
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
        this.cacheValid = true
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
       /* Why is this function complicated? Because firebase has a preference to read from server, where
        * the cache is used for offline references and not cached reads. But we can create a preference for 
        * fast reads from the cache by turning off the network interface, attempting to read, and then 
        * restoring the network interface if the cached read fails.
        */ 
       async function getDocOnce( ref, returnError )
        {
            var getit = null
            try {
                getit = await ref.get( fromServer( bGetFromServer ) )
            }   
            catch (error) {
                if ( returnError ) throw( error )
            }         
            return getit
        }

        async function getDoc( ref, allowCache )
        {
            // first read attempt is cached if that is enabled
            if ( allowCache ) {
                await authn.firestore().disableNetwork()
                var getit = await getDocOnce( ref )
                await authn.firestore().enableNetwork()
                if ( getit && getit.exists ) return getit
            }

            // second read attempt is from server if we are online
            getit = await getDocOnce( ref )
            if ( getit && getit.exists ) return getit

            // in case of some weird error, just try one more time
            // and allow the error to be thrown
            await waitFor( 100 )
            getit = await getDocOnce( ref, true )
            return result
        }

        // returns a promise containing a DocumentSnapshot, 
        // which contains properties: exists, id, metadata; and methods get(), data(), isEqual()
        // attempt to get the query result from cache
        var result = null
        try {
            const doCache = this.cacheValid && global.appConfig.webapp.preferCachedReads
            result = await getDoc( this._ref( docPath ), doCache )
            this.cacheValid = true
        }
        catch (error) {
            console.error( "firestore.js about: ", docPath, error )
        }
        return result
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
        this.cacheValid = false
        var result = null
        try {
            const docRef = this._ref( docPath )
            var snap = await docRef.get( fromServer( true ) )
            await docRef.set( contents, snap.exists ? setMergeFields : setCreateFields )
            const getSnap = await docRef.get()
            result = await getSnap.data() || result
        }
        catch( error ) {
            console.error( "firestore.js write: ", docPath, error )
        }
        return result
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
        const result = await this.about( docPath, bGetFromServer )
        return result ? result.data() : null
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
        var result = null
        try {
            const docRef = this._ref( docPath )
            const snap = await docRef.get( fromServer( bGetFromServer ) )
            result = await snap.get( fieldName ) || result
        }
        catch( error ) {
            console.error( "firestore.js field: ", docPath, fieldName, error )
        }
        return result
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
        this.cacheValid = false
        var result = null
        try {
            result = this._ref( docPath ).delete() || result
        }
        catch (error) {
            console.error( "firestore.js delete: ", docPath, error )
        }
        return result
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
    async query( collectionPath, fieldName, fieldMatch, matchOperator = "==" )
    {
        async function getQuery( ref, returnError )
        {
            try {
                const resultQuery = await ref.where( fieldName, matchOperator, fieldMatch )
                return await resultQuery.get()    
            }
            catch ( error ) {
                if ( returnError ) throw( error )
                return null
            }
        }
        var result = null
        try {
            const collectionRef = this.topdoc.collection( collectionPath )
            // attempt to get the query result from cache
            const doCache = this.cacheValid && global.appConfig.webapp.preferCachedReads
            this.cacheValid = true
            // first query attempt is cached
            if ( doCache ) {
                await authn.firestore().disableNetwork()
                result = await getQuery( collectionRef )
                await authn.firestore().enableNetwork()
            }
            // if we got an error or didn't cache, go directly to the server
            if ( !result || result.empty ) {
                result = await getQuery( collectionRef, true )
            }
        }
        catch (error) {
            console.error( "firestore.js query: ", collectionPath, fieldName, fieldMatch, error )
        }
        return result
    }

    /**
     * This function will insert a new value onto an array field of the Firestore document. Only a new unique
     * value will be stored. 
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @param {*} newValue - The new value to push on the array field
     * @returns {Promise<void>} 
     * @alias module:firestore
     */
    async union( docPath, arrayName, newValue )
    {
        var result = null
        try {
            const updateElement = {}
            updateElement[ arrayName ] = authn.FieldValue.arrayUnion( newValue )
            result = await this._ref( docPath ).update( updateElement ) || result
        }
        catch (error) {
            console.error( "firestore.js union: ", docPath, arrayName, newValue, error )
        }
        return result
    }

    /**
     * This function will remove a value from an array field of the Firestore document.  
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @param {*} newValue - The new value to push on the array field
     * @returns {Promise<void>} 
     * @alias module:firestore
     */
    async remove( docPath, arrayName, oldValue )
    {
        var result = null
        try {
            const updateElement = {}
            updateElement[ arrayName ] = authn.FieldValue.arrayRemove( oldValue )
            result = await this._ref( docPath ).update( updateElement ) || result
        }
        catch (error) {
            console.error( "firestore.js remove: ", docPath, arrayName, oldValue, error )
        }
        return result
    }

    /**
     * This function will push a new value onto an array field of the Firestore document. The document 
     * only updates if the new value doesn't exist in the array. Don't use this function for array values
     * that are complex objects. 
     * @param {string} docPath - Path to a Firebase document
     * @param {string} arrayName - The name of the array field to be updated
     * @param {*} newValue - The new value to push on the array field
     * @param {boolean} [bGetFromServer] - If true, forces a read from the cloud before updating the array field
     * @returns {Promise<void>} The updated array field
     * @alias module:firestore
     */
    async append( docPath, arrayName, newValue, bGetFromServer = false )
    {
        var result = null
        try {
            const docRef = this._ref( docPath )
            const snap = await docRef.get( fromServer( bGetFromServer ) )
            var baseDoc = snap.data()
            var arrayRef = baseDoc[ arrayName ]
            if ( !arrayRef ) arrayRef = baseDoc[ arrayName ] = []
            if ( arrayRef.indexOf( newValue ) < 0 ) {
                arrayRef.push( newValue )
                await docRef.set( baseDoc, setMergeFields )
            }
            result = arrayRef
        }
        catch (error) {
            console.error( "firestore.js append: ", docPath, arrayName, newValue, error )
        }
        return result
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
        var result = null
        try {
            const docRef = this._ref( docPath )
            const snap = docRef.get( fromServer( bGetFromServer ) )
            var baseDoc = snap.data()
            var arrayRef = baseDoc[ arrayName ]
            if ( !arrayRef ) return result
            const found = arrayRef.indexOf( oldValue )
            if ( found > 0 ) 
            {   
                arrayRef.splice( found, 1 )
                await docRef.set( baseDoc, setMergeFields )
            }
            result = arrayRef
        }
        catch (error) {
            console.error( "firestore.js splice: ", docPath, arrayName, oldValue, error )
        }
        return result
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
    try {
        fireSet.doc    = new firestoreDoc( "users", userid, "doc" )
        fireSet.app    = new firestoreDoc( "apps", projectId, "app" )
        fireSet.public = new firestoreDoc( "apps", "public", "public" )
        Object.assign( module.exports, fireSet )
    }
    catch (error) {
        console.error( "firestore.js initialize: ", error )
    }
}

module.exports = {
    initialize: initialize
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}