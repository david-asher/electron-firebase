/* fbstorage.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Interface to Google Cloud Storage in the security context of the authenticated user. 
 * Keep track of every file add/remove in firestore because
 * firebase cloud storage does not allow listing/searching for files.
 * And use the REST API directly because the node.js interface does not include storage.
 * Ugh.
 * 
 * @example <caption>To enable user-level security, go to the Firebase console and set the 
 * storage rules to the following.</caption>
 * 
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /users/{userId}/{allPaths=**} {
 *       allow read, write: if request.auth.uid == userId;
 *     }
 *     match /apps/{projectId}/{allPaths=**} {
 *       allow read, write: if request.auth != null && request.auth.token.aud == projectId;
 *     }
 *     match /public/{allPaths=**} {
 *       allow read: if true
 *       allow write: if request.auth != null
 *     }
 *   }
 * }
 * 
 * @see {@link https://firebase.google.com/docs/storage/|Firebase Storage}
 * @see {@link https://console.firebase.google.com/|Firebase Console}
 * @see {@link https://firebase.google.com/docs/storage/security/|Firebase Security Rules}
 * @see {@link https://cloud.google.com/storage/docs/naming#objectnames|Object Naming Guidelines}
 * @module store
 */

const applib = require( './applibrary' )
const authn = require( './authentication' )
const firestore = require( './firestore' )

// firestore database tracking for all files happens in this sub-collection
const fileCollection = ".fileset"
const folderListDoc  = ".FolderList"
const folderArray    = "-folder-names-"

// fileStore root collections, for object persistence and internal reference
var storageSet = {}

class fileStore
{
    /**
     * Create a new fileStore interface.
     * @param {string} firestoreRoot - a database object defined in firestore.js 
     * @param {string} storeName - just a moniker
     * @param {string} setPrefix - the first two segments of the file path, e.g. user/userid
     * @returns {null} 
     */
    constructor( firestoreRoot, storeName, setPrefix )
    {
        this.name = storeName
        this.root = firestoreRoot 
        this.prefix = setPrefix
    }

    _cleanPath( filename )
    {
        return ( filename || "" ).replace( /^\/+/, '' )
    }

    _urlPath( filename )
    {
        // encodeURIComponent encoding of filename so we don't get slashes and non-ascii stuff
        // so ".files/" is the Firebase collection and filename is the document

        return `${fileCollection}/${encodeURIComponent( this._cleanPath( filename ) )}`
    }

    _dbPath( filename )
    {
        // like _urlPath but without path encoding
        return `${fileCollection}/${this._cleanPath( filename )}`
    }

    _fromServer( optionalSourceFromServer )
    {
        return { source: optionalSourceFromServer ? "server" : "default" }
    }

    async _findFileDb( property, criteria, optionalMathOperator = "==" )
    {
        // returns a promise containing a QuerySnapshot
        // https://firebase.google.com/docs/reference/js/firebase.firestore.QuerySnapshot
        return await this.root.query( fileCollection, property, criteria, optionalMathOperator )
    }

    async _updateFileDb( filename, contents )
    {
        // returns a promise containing void, indicating that the backend data write is resolved
        // https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#set
        return await this.root.write( this._urlPath( filename ), contents )
    }

    async _appendFileDb( filename, arrayName, newValue )
    {
        return await this.root.append( this._urlPath( filename ), arrayName, newValue, true )
    }

    async _unionFileDb( foldername )
    {
        // keeps a list of unique folder names
        return await this.root.union( this._dbPath( folderListDoc), folderArray, foldername )
    }

    async _removeFolderDb( folderPath )
    {
        // remove an entry from the folder list only if there are no more files in the
        // database matching this file's foldername
        var result = null
        try {
            const folderList = await this.list( folderPath )
            if ( folderList && 0 < folderList.length ) return result
            result = await this.root.remove( this._dbPath( folderListDoc), folderArray, folderPath ) || result
        }
        catch (error) {
            console.error( "fbstorage.js _removeFolderDb: ", folderPath )
        }
        return result
    }

    async _initFolderList()
    {
        var result = null
        try {
            const response = await this.root.about( this._dbPath( folderListDoc ) )
            if ( response && response.exists ) return result
            const updateMap = {}
            updateMap[ folderArray ] = []
            result = await this.root.write( this._dbPath( folderListDoc ), updateMap ) || result
        }
        catch (error) {
            console.error( "fbstorage.js _initFolderList: ", this.name, error )
        }
        return result
    }

    async _deleteDocListDb( docList )
    {
        try {
            await docList.forEach( async ( queryDocumentSnapshot ) => {
                const docRef = queryDocumentSnapshot.ref
                await docRef.delete()
            })
        }
        catch (error) {
            console.error( "fbstorage.js _deleteDocListDb: ", docList, error )
        }
    }

    _pathPrefix( filepath )
    {
        if ( typeof filepath !== 'string' || filepath.length == 0 ) return ""
        // remove leading slashes so the splice looks nice
        return `${this.prefix}/${filepath.replace(/^\/+/, '')}`
    }

    _objectPathUrl( filepath )
    {
        const fullPath = this._pathPrefix( filepath )
        const storagePath = fullPath.length == 0 ? "" : `/${encodeURIComponent( fullPath )}`
        return {
            hostname: "firebasestorage.googleapis.com",
            pathname: `/v0/b/${global.fbConfig.storageBucket}/o${storagePath}`
        }
    }

    async _newestDoc( docList, compareField )
    {
        var result = null
        try {
            if ( !Array.isArray( docList ) ) return result
            if ( docList.length == 0 ) return result
            result = await docList.reduce( async ( accumulator, currentValue ) => {
                const currentField = await currentValue.get( compareField )
                const accumulatedField = await accumulator.get( compareField )
                return ( currentField > accumulatedField ) ? currentValue : accumulator
            })
        }
        catch (error) {
            console.error( "fbstorage.js _newestDoc: ", docList, compareField, error )
        }
        return result
    }

    /**
     * Searches the Cloud Firestore database for a file record that matches the given filepath
     * @param {string} filepath - Path and filename to find the file in the Cloud, relative to the current user
     * @returns {Promise} A Promise object representing the Cloud Firestore record
     * @alias module:store
     */
    _metaFixup( fileMeta )
    {
        if ( !fileMeta ) return {}
        const isNow = ( new Date() ).toISOString()

        var metaDB = {
            contentType: fileMeta.contentType || "",
            timeCreated: fileMeta.timeCreated || isNow,
            updated: isNow,
            size: fileMeta.size || 0,
            md5Hash: fileMeta.md5Hash || ""
        }

        // assemble various path parts for the meta
        var pathParts = fileMeta.name.split("/")
        pathParts.splice(0,2) // remove first two segments, e.g. /user/userid
        metaDB.path = pathParts.join("/")
        metaDB.name = pathParts.pop() // remove last segment as file name
        metaDB.folder = pathParts.join("/")
        const url = this._objectPathUrl( metaDB.path )
        metaDB.downloadUrl = `https://${url.hostname}${url.pathname}?alt=media&token=${fileMeta.downloadTokens}`
        return metaDB
    }

    _makeUploadOptions( filepath, contents )
    {
        // see: https://cloud.google.com/storage/docs/json_api/v1/how-tos/simple-upload
        const options = {
            method: "POST",
            url: this._objectPathUrl(),
            qs: { 
                name: this._pathPrefix( filepath ) 
            },
            json: true
        }
        if ( applib.isJSON( contents ) ) {
            options.body = applib.parseJSON( contents )
            return options
        }
        options.body = contents
        if ( Buffer.isBuffer( contents ) || typeof contents == 'string' ) {
            options.json = false
        }
        return options
    }

    /**
     * Search the storage records in the Firestore database for a file matching the 
     * specific filepath given. The newest document matching the search criteria will be returned.
     * @param {string} filepath - Path and filename to store the file in the Cloud
     * @param {string} queryMatch - optional match parameter to query for something other than path
     * @returns {object} - metafile descriptor for the requested file
     * @alias module:store
     */
    async find( filepath, queryMatch = "path" )
    {
        // The firebase-y way to get the newest document would be a compound query like 
        // .where( "path", "==", meta.path ).orderBy( "updated", "desc" ).limit( 1 )
        // but that requires building an index which we can't do programatically
        // from the client, and since we are expecting a short doc list, let's just 
        // run a basic .where() query then spin through the docs and find the newest
        // if the doc exists (i.e. matches the path) then we've found the doc

        const querySnapshot = await this.root.query( fileCollection, queryMatch, filepath )
        return await this._newestDoc( querySnapshot.docs, "updated" )
    }

    /**
     * Search the storage records in the Firestore database for all files where their folder matches the 
     * specific path given, and return an array with the metadata for each file.
     * @param {string} folderpath - Path to query file storage
     * @param {string} queryMatch - optional match parameter to query for something other than folder
     * @returns {object} - metafile descriptor for the requested file
     * @alias module:store
     */
    async list( folderpath, queryMatch = "folder" )
    {
        var folderList = []
        try {
            const querySnapshot = await this._findFileDb( queryMatch, folderpath || "" )
            await querySnapshot.docs.forEach( async (snapshot) => {
                folderList.push( await snapshot.data() )
            })
        }
        catch (error) {
            console.error ( "list: ", folderpath, queryMatch, error )
        }
        return folderList
    }
    
    /**
     * Return a list of all folders. Folders don't really exist, they are just a slash-separated 
     * path construct, the parent of the file path.
     * @param {*} filepath 
     * @param {*} content 
     */
    async folders( matchPath = "" )
    {
        var folderMap = []
        try {
            const folderAll = await this.root.read( this._dbPath( folderListDoc) )
            folderMap = folderAll[ folderArray ].filter( (element) => {
                return element.startsWith( matchPath )
            })
        }
        catch (error) {
            console.error ( "folders: ", error )
        }
        return folderMap
    }

    /**
     * Uploads local content and creates a file in Google Cloud Storage for Firebase, 
     * and a record of the file will be kept in the Cloud Firestore database, for easy 
     * reference and searching. Accepts contents as string, JSON string, object (serializable), 
     * array, or buffer.
     *  
     * Returns a Promise containing file metadata, as:
     * { name: 'users/[user-id]/Test/FileTest',
     *   bucket: 'your-app-here.appspot.com',
     *   generation: '123456789123456',
     *   metageneration: '1',
     *   contentType: 'application/json',
     *   timeCreated: '2019-02-05T03:06:24.435Z',
     *   updated: '2019-02-05T03:06:24.435Z',
     *   storageClass: 'STANDARD',
     *   size: '1005',
     *   md5Hash: 'H3Anb534+vX2Y1HVwJxlyw==',
     *   contentEncoding: 'identity',
     *   contentDisposition: 'inline; filename*=utf-8\'\'FileTest',
     *   crc32c: 'yTf15w==',
     *   etag: 'AAAAAAA=',
     *   downloadTokens: '00000000' 
     * }
     * @param {string} filepath - Path and filename to store the file in the Cloud
     * @param {string|JSON|buffer|object|array} content - File content to be written, objects must be serializable
     * @returns {object} - metafile descriptor for the requested file
     * @alias module:store
     */
    async upload( filepath, content )
    {
        var metaResult = {}
        try {
            // There isn't a node.js API for Firebase Storage, so we call REST directly
            const uploadOptions = this._makeUploadOptions( filepath, content )
            // see: https://cloud.google.com/storage/docs/json_api/
            const fileMeta = await authn.gcpApi( uploadOptions )
            // after the file is written to cloud storage, fixup the metadata and save that to firebase
            metaResult = this._metaFixup( fileMeta )
            // meta.path will be a path segment + filename relative to the user's folder
            // It's possible that more than one file exists with this path, so take the newest
            const foundDoc = await this._findFileDb( "path", metaResult.path )
            // if the doc exists (i.e. matches the path) then we've found the doc
            // and will update it, otherwise we create a new doc & new docId
            const latestDocId = foundDoc.docid || null
            // firebase cloud store will overwrite the file, updating the create time
            // so let's keep the original create time in firestore, and track the docId
            if ( latestDocId ) {
                delete metaResult.timeCreated
                metaResult.docid = latestDocId
            }
            // every time we write a file to cloud firestore, we must update a database file entry
            await this._updateFileDb( filepath, metaResult )
            // save the folder
            await this._unionFileDb( metaResult.folder )
        }
        catch (error) {
            console.error ( "upload: ", filepath, error )
        }
        return metaResult
    }

    /**
     * Change some metadata aspects of a stored file
     * @param {string} filepath - Path and filename to update the file in the Cloud, relative to the current user
     * @param metadata - One or more metadata parameters to change
     * @returns {object} - metafile descriptor for the requested file
     * @param {string} metadata.cacheControl - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
     * @param {string} metadata.contentDisposition - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/content-Disposition
     * @param {string} metadata.contentEncoding - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
     * @param {string} metadata.contentLanguage - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language
     * @param {string} metadata.contentType - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
     * @alias module:store
     */
    async update( filepath, metadata )
    {
        var metaResult = {}
        try {
            // see: https://firebase.google.com/docs/storage/web/file-metadata
            const fileMeta = await authn.gcpApi( {
                method: "PATCH",
                url: _objectPathUrl( filepath ),
                json: true,
                body: metadata
            } )
            metaResult = this._metaFixup( fileMeta )
            const foundDoc = await this.find( metaResult.path )
            const latestDocId = foundDoc.docid || null
            if ( latestDocId ) {
                delete metaResult.timeCreated
                metaResult.docid = latestDocId
            }
            await this._updateFileDb( latestDocId, metaResult )
        }
        catch (error) {
            console.error( "fbstorage.js update: ", filepath, metadata, error )
        }
        return metaResult
    }

    /**
     * Download a file from Firebase Storage. 
     * @param {string} filepath - Path and filename to retreive the file
     * @returns {string|JSON|buffer|object|array} - file content
     * @alias module:store
     */
    async download( filepath )
    {
        // see: https://cloud.google.com/storage/docs/json_api/v1/objects/get
        var result = {}
        try {
            result = await authn.gcpApi( {
                method: "GET",
                url: this._objectPathUrl( filepath ),
                qs: { alt: "media" }
            })
        }
        catch (error) {
            console.error( "fbstorage.js download: ", filepath, error )
        }
        return result
    }

    /**
     * Gets meta information about the file, including a secure download URL that can be used anywhere
     * @param {string} filepath - Path and filename to find the file in the Cloud, relative to the current user
     * @returns {Promise} A Promise object representing the meta information about the file
     * @alias module:store
     */
    async about( filepath )
    {
        var aboutFile = { exists: false }
        try {
            const querySnapshot = await this._findFileDb( "path", filepath )
            const queryResult = await this._newestDoc( querySnapshot.docs, "updated" )
            if ( !queryResult ) return aboutFile
            aboutFile = queryResult.data()
            aboutFile.exists = true
        }
        catch (error) {
            console.error( "fbstorage.js about: ", filepath, error )
        }
        return aboutFile
    }

    /**
     * Delete the file from Google Cloud Storage for Firebase and remove the file's record from 
     * Cloud Firestore
     * @param {string} filepath - Path and filename to delete the file in the Cloud, relative to the current user
     * @return {null|string} - empty response unless there is an error
     * @alias module:store
     */
    async delete( filepath )
    {
        var result = null
        try {
            const response = await authn.gcpApi({
                method: "DELETE",
                url: this._objectPathUrl(),
                qs: { 
                    name: this._pathPrefix( filepath ) 
                }
            })
            // if the file doesn't exist, return null but don't try to delete a database entry
            if ( response ) {
                return { error: response }
            }
            // look for all firestore documents matching the filepath and delete them all
            // then delete the matching file in firebase cloud storage
            const querySnapshot = await this._findFileDb( "path", filepath )
            await this._deleteDocListDb( querySnapshot.docs ) 
            // check for folder path removal from database
            const folder = filepath.split('/').slice(0,-1).join('/')
            result = await this._removeFolderDb( folder ) || result
        }
        catch (error) {
            console.error( "fbstorage.js delete: ", filepath, error )
        }
        return result
    }
}


/**
 * Firebase Storage interfaces are defined when your app starts (this function
 * must be called after firestore is initialized):
 * * .file - Access to files that are restricted to the signed-in user
 * * .app - Access to files that are restricted to all users of this app
 * * .public - File access without restrictions 
 * @alias module:firestore
 */
async function initialize()
{
    try {
        // each of the 3 security contexts gets its own storage interface
        storageSet.file   = new fileStore( firestore.doc, "file", authn.userPath() )
        storageSet.app    = new fileStore( firestore.app, "app", `apps/${global.fbConfig.projectId}` )
        storageSet.public = new fileStore( firestore.public, "public", "apps/public" )

        // create one document in each .fileset to track the folder names
        await storageSet.file._initFolderList()
        await storageSet.app._initFolderList()
        await storageSet.public._initFolderList()

        // export 'em
        Object.assign( module.exports, storageSet )
    }
    catch (error) {
        console.error( "fbstorage.js initialize: ", error )
    }
}

module.exports = {
    initialize: initialize
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}