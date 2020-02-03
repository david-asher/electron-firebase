/* index.js
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
    if ( !App ) App = admin.initializeApp( { serviceAccountId: data.serviceAccountId } )
    return admin.auth().createCustomToken( data.userid )
})

module.exports = {
    customToken: customToken
}