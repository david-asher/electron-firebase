
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

const helloWorld = functions.https.onCall((data,context) => {
    return { data: data } 
})

const getContext = functions.https.onCall( (data,context) => {
    return { 
        data: data, 
        headers: context.rawRequest.headers, 
        domain: context.rawRequest.domain, 
        url: context.rawRequest.url,
        query: context.rawRequest.query, 
        params: context.rawRequest.params, 
        body: context.rawRequest.body, 
        properties: Object.getOwnPropertyNames( context.rawRequest ) 
    } 
})

// MUST ENABLE IAM API
// go to https://console.developers.google.com/apis/library/iam.googleapis.com?project=test-electron-eeab2

function deleteApp()
{
    if ( admin.apps.length > 0 ) {
        return admin.apps[0].delete()
    }
    return Promise.resolve( 0 )
}

const customToken = functions.https.onCall( (data,context) => {

    console.log( "customToken data: ", data )

    return deleteApp()
    .then( () => {
        admin.initializeApp( { serviceAccountId: data.serviceAccountId } )
        return 0
    })
    .then( () => {
        return admin.auth().createCustomToken(data.userid)
    })
    .then( (customToken) => {
        console.log( "customToken: ", customToken )
      return customToken
    })
    .catch( (error) => {
      console.log('Error creating custom token:', error)
    }) 
})

module.exports = {
    helloWorld: helloWorld,
    getContext: getContext,
    customToken: customToken
}