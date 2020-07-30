/*
 * firebase-deploy.js
 */

const { execSync } = require( 'child_process' )
const { exit } = require('process')

const fbrcFile = "./.firebaserc"
const fbDeployFile = "./firebase.json"

function writeJson( filePath, jsonContent )
{
    fs.writeFileSync( filePath, JSON.stringify( jsonContent, null, 2 ) )
}

function fbDeploy( command )
{
    execSync( "firebase deploy --only " + command )
}

const fbConfig = require( './config/firebase-config.json' )
console.log( "bucket = ", fbConfig.storageBucket )
if ( !fbConfig.storageBucket ) {
    console.log( "ERROR: firebase-config.json must be configured for your firebase project." )
    exit(10)
}

console.log( "** configure .firebaserc file" )
var fbrcJson = require( fbrcFile )
console.log( "fbrcJson = ", fbrcJson )
fbrcJson.projects.default = fbConfig.projectId
writeJson( fbrcFile, fbrcJson )

console.log( "** deploy firestore:rules" )
fbDeploy( "firestore:rules" )

console.log( "** deploy storage:rules" )
const fbDeployJson = require( fbDeployFile )
console.log( "fbDeployJson = ", fbDeployJson )
fbDeployJson.storage.bucket = fbConfig.storageBucket
writeJson( fbDeployFile, fbDeployJson, null )
fbDeploy( "storage:rules" )

console.log( "** deploy firebase functions" )
fbDeploy( "functions" )
