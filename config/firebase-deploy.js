/*
 * firebase-deploy.js
 * Copyright (c) 2019-2020 by David Asher, https://github.com/david-asher
 * 
 * This script is run from the project root "npm run deploy"
 * and performs firebase deploy for database and storage security rules
 * as well as cloud function deploy
 */

const { execSync } = require( 'child_process' )
const { exit } = require('process')
const { writeFileSync, readFileSync }  = require('fs')

const fbrcFile = "./.firebaserc"
const fbDeployFile = "./firebase.json"

function writeJson( filePath, jsonContent )
{
    writeFileSync( filePath, JSON.stringify( jsonContent, null, 2 ) )
}

function readJson( filePath )
{
    return JSON.parse( readFileSync( filePath ) )
}

function fbDeploy( command )
{
    execSync( "firebase deploy --only " + command )
}

const fbConfig = readJson( './firebase-config.json' )
if ( !fbConfig.storageBucket ) {
    console.error( "ERROR: firebase-config.json must be configured for your firebase project." )
    exit(10)
}

console.log( "** configure .firebaserc file" )
var fbrcJson = readJson( fbrcFile )
fbrcJson.projects.default = fbConfig.projectId
writeJson( fbrcFile, fbrcJson )

console.log( "** deploy firestore:rules" )
fbDeploy( "firestore:rules" )

console.log( "** deploy storage:rules" )
const fbDeployJson = readJson( fbDeployFile )
fbDeployJson.storage[0].bucket = fbConfig.storageBucket
writeJson( fbDeployFile, fbDeployJson, null )
fbDeploy( "storage:rules" )

console.log( "** deploy firebase functions" )
execSync( "npm install", { cwd: "./functions" } )
fbDeploy( "functions" )
