/* fbstorage.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * Interface to Google Cloud Storage in the security context of the authenticated user. 
 * @example <caption>To enable user-level security, go to the Firebase console and set the storage rules to the following.</caption>
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /users/{userId}/{allPaths=**} {
 *       allow read, write: if request.auth.uid == userId;
 *     }
 *   }
 * }
 * @see {@link https://firebase.google.com/docs/storage/|Firebase Storage}
 * @see {@link https://console.firebase.google.com/|Firebase Console}
 * @see {@link https://firebase.google.com/docs/storage/security/|Firebase Security Rules}
 * @see {@link https://cloud.google.com/storage/docs/naming#objectnames|Object Naming Guidelines}
 * @module store
 */

const applib = require( './applibrary' )
const authn = require( './authentication' )
const firestore = require( './firestore' )

function _userPrefix( filepath )
{
    // remove leading slashes so the splice looks nice
    return `${authn.userPath()}/${(filepath || "").replace(/^\/+/, '')}`
}

function _objectPathUrl( filepath )
{
    const objectPath = filepath ? `/${encodeURIComponent( _userPrefix( filepath ) )}` : ""
    return {
        hostname: "firebasestorage.googleapis.com",
        pathname: `/v0/b/${global.fbConfig.storageBucket}/o${objectPath}`
    }
}

function _metaFixup( fileMeta )
{
    if ( !fileMeta ) return {}
    var pathParts = fileMeta.name.split("/")
    const partslen = pathParts.length

    if ( partslen < 2 || `${pathParts[0]}/${pathParts[1]}` != authn.userPath() ) {
        throw( "Whoa! This isn't our user in the file path" )
    }
    const isNow = ( new Date() ).toISOString()

    var meta = {
        fullPath: fileMeta.name,
        name: pathParts[ partslen - 1 ],
        parent: ( partslen > 1 ) ? pathParts[ partslen - 2 ] : null,
        contentType: fileMeta.contentType || "",
        timeCreated: fileMeta.timeCreated || isNow,
        updated: isNow,
        size: fileMeta.size || 0,
        md5Hash: fileMeta.md5Hash || ""
    }

    pathParts.splice(0,2)
    meta.path = pathParts.join("/")
    const pathURL = _objectPathUrl( meta.path )
    meta.downloadUrl = `https://${pathURL.hostname}${pathURL.pathname}?alt=media&token=${fileMeta.downloadTokens}`

    return meta
}

function _makeUploadOptions( filepath, contents )
{
    // see: https://cloud.google.com/storage/docs/json_api/v1/how-tos/simple-upload
    const options = {
        method: "POST",
        url: _objectPathUrl(),
        qs: {
            name: _userPrefix( filepath )
        }
    }
    options.body = contents
    options.json = true
    if ( Buffer.isBuffer( contents ) ) {
        options.json = false
        return options
    }
    if ( applib.isJSON( contents ) ) {
        options.body = applib.parseJSON( contents )
        return options
    }
    if ( typeof contents == 'string' ) {
        options.json = false
    }
    return options
}

function _catchHandler( error )
{
    return Promise.reject( error )
}

/*
 * uploadFile( filepath, contents )
 * accepts contents as string, JSON string, object (serializable), array, buffer
 * 
 * returns Promise containing file metadata, such as:
 { name: 'users/[user-id]/Test/FileTest',
  bucket: 'your-app-here.appspot.com',
  generation: '123456789123456',
  metageneration: '1',
  contentType: 'application/json',
  timeCreated: '2019-02-05T03:06:24.435Z',
  updated: '2019-02-05T03:06:24.435Z',
  storageClass: 'STANDARD',
  size: '1005',
  md5Hash: 'H3Anb534+vX2Y1HVwJxlyw==',
  contentEncoding: 'identity',
  contentDisposition: 'inline; filename*=utf-8\'\'FileTest',
  crc32c: 'yTf15w==',
  etag: 'AAAAAAA=',
  downloadTokens: '00000000' }
 */

/**
 * Uploads local content and creates a file in Firebase. The file will be stored in 
 * Google Cloud Storage for Firebase, and a record of the file will be kept in the 
 * Cloud Firestore database, for easy reference and searching.  
 * @param {string} filepath - Path and filename to store the file in the Cloud, relative to the current user
 * @param {string|JSON|buffer|object|array} content - File content to be written, objects must be serializable
 * @alias module:store
 */
async function uploadFile( filepath, content )
{
    let metaResult, foundDoc

    const uploadOptions = _makeUploadOptions( filepath, content )

    // after the file is written to cloud storage, fixup the metadata and save that to firebase
    return authn.gcpApi( uploadOptions )
    .then( async (fileMeta) => {
        metaResult = _metaFixup( fileMeta )
        // meta.path will be a path segment + filename relative to the user's folder
        // It's possible that more than one file exists with this path, so take the newest
        return findFileByPath( metaResult.path )
    })
    .then( async (docSearchResult) => {
        foundDoc = docSearchResult || {}
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
        return _updateFileDb( latestDocId, metaResult )
    })
    .then( async (updatedDoc) => {
        return metaResult
    })
    .catch( _catchHandler ) 
}

/**
 * Download a file from Firebase. 
 * @param {string} filepath - Path and filename to retreive the file from the Cloud, relative to the current user
 * @alias module:store
 */
async function downloadFile( filepath )
{
    // see: https://cloud.google.com/storage/docs/json_api/v1/objects/get
    var options = {
        method: "GET",
        url: _objectPathUrl( filepath ),
        qs: {
            alt: "media"
        }
    }
    return authn.gcpApi( options )
}

function _newestDoc( docList, compareField )
{
    if ( !Array.isArray( docList ) ) return null
    if ( docList.length == 0 ) return null
    return docList.reduce( ( accumulator, curValue ) => {
        return ( curValue.get( compareField ) > accumulator.get( compareField ) ) ? curValue : accumulator
    }).data()
}

/**
 * Searches the Cloud Firestore database for a file record that matches the given filepath
 * @param {string} filepath - Path and filename to find the file in the Cloud, relative to the current user
 * @returns {Promise} A Promise object representing the Cloud Firestore record
 * @alias module:store
 */
async function findFileByPath( filepath )
{
    // The firebase-y way to get the newest document would be a compound query like 
    // .where( "path", "==", meta.path ).orderBy( "updated", "desc" ).limit( 1 )
    // but that requires building an index which we can't do programatically
    // from the client, and since we are expecting a short doc list, let's just 
    // run a basic .where() query then spin through the docs and find the newest        

    return _findFileDb( "path", filepath )
    .then( async ( querySnapshot ) => {
        if ( querySnapshot.empty ) {
            return null
        }
        // if the doc exists (i.e. matches the path) then we've found the doc
        return _newestDoc( querySnapshot.docs, "updated" )
    })
    .catch( _catchHandler )
}

// didn't use this function, but didn't want to delete it
async function _getFileMeta( filepath )
{
    // see: https://cloud.google.com/storage/docs/json_api/v1/objects/get
    const options = {
        method: "GET",
        url: _objectPathUrl( filepath )
    }
    return authn.gcpApi( options )
}

/**
 * Gets meta information about the file, including a secure download URL that can be used anywhere
 * @param {string} filepath - Path and filename to find the file in the Cloud, relative to the current user
 * @returns {Promise} A Promise object representing the meta information about the file
 * @alias module:store
 */
async function aboutFile( filepath )
{
    return _findFileDb( "path", filepath )
    .then( async (querySnapshot) => {
        return _newestDoc( querySnapshot.docs, "updated" )
    })
    .catch( _catchHandler )
}

/**
 * Change some metadata aspects of a stored file
 * @param {string} filepath - Path and filename to update the file in the Cloud, relative to the current user
 * @param metadata - One or more metadata parameters to change
 * @param {string} metadata.cacheControl - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 * @param {string} metadata.contentDisposition - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/content-Disposition
 * @param {string} metadata.contentEncoding - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
 * @param {string} metadata.contentLanguage - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language
 * @param {string} metadata.contentType - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
 * @alias module:store
 */
async function updateFileMeta( filepath, metadata )
{
    // see: https://firebase.google.com/docs/storage/web/file-metadata
    var options = {
        method: "PATCH",
        url: _objectPathUrl( filepath ),
        json: true,
        body: metadata
    }
    return authn.gcpApi( options )
}

/**
 * Delete the file from Google Cloud Storage for Firebase and remove the file's record from 
 * Cloud Firestore
 * @param {string} filepath - Path and filename to delete the file in the Cloud, relative to the current user
 * @alias module:store
 */
async function deleteFile( filepath )
{
    // look for all firestore documents matching the filepath and delete them all
    // then delete the matching file in firebase cloud storage
    return _findFileDb( "path", filepath )
    .then( async (querySnapshot) => {
        _deleteDocListDb( querySnapshot.docs ) 
        return null
    })
    .catch( _catchHandler )
    .finally( () => {
        // see: https://cloud.google.com/storage/docs/json_api/v1/objects/delete
        const objectPath = encodeURIComponent( _userPrefix( filepath ) )
        var options = {
            method: "DELETE",
            url: {
                hostname: "firebasestorage.googleapis.com",
                pathname: `/v0/b/${global.fbConfig.storageBucket}/o/${objectPath}`
            }
        }
        return authn.gcpApi( options )
    })
}

/*
 * Keep track of every file add/remove in firestore because
 * firebase cloud storage does not allow listing/searching for files.
 * Ugh.
 */

function _findFileDb( property, criteria )
{
    // returns a promise containing a QuerySnapshot
    // https://firebase.google.com/docs/reference/js/firebase.firestore.QuerySnapshot
    return firestore.docFind( firestore.FILES, property, criteria )
}

function _updateFileDb( filePath, contents )
{
    // returns a promise containing void, indicating that the backend data write is resolved
    // https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#set

    const docRef = firestore.docRef( firestore.FILES, filePath )
    if ( !filePath ) contents.docid = docRef.id
    return docRef.set( contents, firestore.MERGE )
}

async function _deleteDocListDb( docList )
{
    await docList.forEach( async ( queryDocumentSnapshot ) => {
        const docRef = queryDocumentSnapshot.ref
        await docRef.delete()
    })
}

// for completeness, didn't use this
function _removeFileDb( filePath )
{
    // returns a promise containing void, indicating that the backend data write is resolved
    // https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#set

    return firestore.docDelete( filePath )
}

module.exports = {
    uploadFile: uploadFile,
    aboutFile: aboutFile,
    downloadFile: downloadFile,
    findFileByPath: findFileByPath,
    updateFileMeta: updateFileMeta,
    deleteFile: deleteFile
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}