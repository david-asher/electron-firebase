/* index.js
 * Copyright (c) 2019-2021 by David Asher, https://github.com/david-asher
 *
 * This cloud function must be deployed to the firebase account in order to 
 * pass a custom token back to the main app (node.js) after a browser-based 
 * login completes, so that the main app can sign in with the same user
 * credential.
 * 
 * The firebase tools Command Line Interface (CLI) must be installed.
 *      npm install -g firebase-tools
 *      see: https://github.com/firebase/firebase-tools
 * 
 * This file is pushed to the firebase cloud functions with the command:
 *      firebase deploy 
 */

 // The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

var App = null

const customToken = functions.https.onCall( (data,context) => 
{
    try {
        if ( !App ) App = admin.initializeApp( { 
            serviceAccountId: data.serviceAccountId,
            projectId: data.projectId
        })
        return admin.auth().createCustomToken( data.userid )    
    }
    catch( error ) {
        functions.logger.log( "customToken error = ", error );
        return { error: error }
    }
})

module.exports = {
    customToken: customToken
}