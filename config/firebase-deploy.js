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
const path = require('path')
const { env } = require('process')
const os = require('os')

const fbrcFile = "./.firebaserc"
const fbDeployFile = "./firebase.json"
const fbConfigFile = "firebase-config.json"

function writeJson( filePath, jsonContent )
{
    writeFileSync( filePath, JSON.stringify( jsonContent, null, 2 ) )
}

function readJson( filePath )
{
    try {
        return JSON.parse( readFileSync( filePath ) )
    }
    catch (error) {
        return null
    }
}

function fbDeploy( command )
{
    execSync( "firebase deploy --only " + command, {stdio:'inherit'} )
}

function addToPath( newPath )
{
    env.PATH = `${newPath}${path.delimiter}${env.PATH}`
}

(function()
{
    var fbConfig = readJson( `./developer/${fbConfigFile}` )
    if ( !fbConfig ) fbConfig = readJson( `./config/${fbConfigFile}` )
    if ( !fbConfig ) {
        console.error( `ERROR: cannot find ${fbConfigFile}` ) 
        exit(10)
    }
    if ( !fbConfig.storageBucket || !fbConfig.projectId ) {
        console.error( "ERROR: ${fbConfigFile} must be configured for your firebase project." )
        exit(11)
    }

    console.log( "** login to firebase-tools with the Google account that you use for Firebase" )
    const npmGlobal = path.join( os.homedir(), ".npm-global" )
    const npmGlobalBin = path.join( npmGlobal, "bin" )
    addToPath( npmGlobal )
    addToPath( npmGlobalBin )
    execSync( `npm config set prefix "${npmGlobal}"` ) 
    execSync( "firebase login", {stdio:'inherit'} )

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
})()
