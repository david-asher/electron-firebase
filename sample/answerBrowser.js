/* answerBrowser.js
 * electron-firebase
 * This is a quickstart template for building Firebase authentication workflow into an electron app
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 * 

'use strict';

/*
 * This module contains functions that respond to queries from the Browser
 * @module answerBrowser
 */

const { firestore, fbstorage } = require( '../electron-firebase' )

const docAboutmeFolder = "aboutme/"

function buildProfile( user )
{
    return {
        "Name": user.displayName,
        "Email": user.email,
        "User ID": user.uid,
        "Photo:": user.photoURL,
        "Last Login": (new Date( parseInt(user.lastLoginAt,10) )).toString()
    }
}

function getUser( parameter )
{
    switch( parameter )
    {
        case 'profile':  return buildProfile( global.user )
        case 'provider': return global.user.providerData[0]
        case 'context':  return global.appContext
    }
}

async function getDocs( filename )
{
    var docContent
    try {
        docContent = await firestore.doc.read( docAboutmeFolder + filename )
    }
    catch (error) {
        console.error( "getDocs: ", filename, error )
        docContent = {}
    }
    return docContent
}

async function listFolders( domain = "file" )
// domain is file | app | public
{
    var folderList
    try {
        folderList = await fbstorage[ domain ].folders()
    }
    catch (error) {
        console.error( "listFolders: ", domain, error )
        folderList = {}
    }
    return folderList
}

async function listFiles( folderPath, domain = "file"  )
{

console.log( "listFiles: ", folderPath, domain )

    var fileList
    try {
        fileList = await fbstorage[ domain ].list( folderPath )

console.log( "fileList: ", fileList )

        
    }
    catch (error) {
        console.error( "listFiles: ", domain, error )
        fileList = {}
    }
    return fileList
}

async function infoRequest( request, parameters )
{
    var sendContent
    switch( request ) {
    case 'user': 
        sendContent = await getUser( parameters[0] )
        break;
    case 'docs':
        sendContent = await getDocs( parameters[0] )
        break;
    case 'folder-list':
        sendContent = await listFolders( parameters[0] )
        break;
    case 'file-list':
        sendContent = await listFiles( parameters[0], parameters[1] )
        break;
    }
    return sendContent
}

module.exports = {
    infoRequest: infoRequest
}
