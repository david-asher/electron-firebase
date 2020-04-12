/* fbdata.js
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
 * @module data
 */

const firestore = require( './firestore' ).firestoreDoc

const eachUserCollection    = "users"
const eachAppCollection     = "apps"
const globalDocCollection   = "global"

// firestoreDoc root collections
var myDocsBase = null
var myAppsBase = null
var globalBase = null

function initialize( userid, appid )
{
    module.exports.docs = myDocsBase = new firestore( eachUserCollection, userid )
    module.exports.apps = myAppsBase = new firestore( eachAppCollection, appid )
    module.exports.global = globalBase = new firestore( globalDocCollection, globalDocCollection )
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
    /************************************************************************************

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

************************************************************************************/
    return baseDocs.root
}


module.exports = {
    initialize: initialize,
    docs: myDocsBase,
    apps: myAppsBase,
    global: globalBase  
}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}