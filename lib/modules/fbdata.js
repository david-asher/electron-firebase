/* fbdata.js
 * Copyright (c) 2020 by David Asher, https://github.com/david-asher
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

const firestore = require( './firestore' )

const eachUserCollection    = "users"
const globalCollection      = "global"
const userDocCollection    = "docs"

// root collections
var myDocsRoot = null
var globalRoot = null

function initialize( user, app )
{
    myDocsRoot = new firestore( "users", user.uid )
    globalRoot = new firestore( "global", app.appid )
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
    initialize: initialize

}

if ( global.__TESTMODE__ ) {
    module.exports.modulename = () => { return __filename.split("/").splice(-1)[0] }
    module.exports.probe = (fname,...args) => { return eval(fname).apply( this, args ) }
}