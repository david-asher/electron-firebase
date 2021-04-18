/* answerBrowser.js
 * Copyright (c) 2019-2021 by David Asher, https://github.com/david-asher
 *
 * This is a quickstart template for building Firebase authentication workflow into an electron app
 * This module contains functions that respond to queries from the Browser
 * @module answerBrowser
 */
'use strict';

const { mainapp, firestore, fbstorage, fbwindow } = loadModule( 'electron-firebase' )
const urlParser = require('url').parse

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
    var fileList
    try {
        fileList = await fbstorage[ domain ].list( folderPath )
    }
    catch (error) {
        console.error( "listFiles: ", domain, error )
        fileList = {}
    }
    return fileList
}

async function infoRequest( request, ...parameters )
{
    var sendContent
    switch( request ) {
    case 'user': 
        sendContent = await getUser( parameters[0] )
        break
    case 'docs':
        sendContent = await getDocs( parameters[0] )
        break
    case 'folder-list':
        sendContent = await listFolders( parameters[0] )
        break
    case 'file-list':
        sendContent = await listFiles( parameters[0], parameters[1] )
        break
    }
    mainapp.sendToBrowser( 'info-request', sendContent )
}

async function getContent( filepath, domain = "file" )
{
    if ( !filepath || filepath.length == 0 ) return {}
    return await fbstorage[ domain ].download( filepath )
}

function openWithUrl( url, contentType )
{
    // see BrowserWindow options: https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions
    const urlParts = urlParser( url )
    const lastPart = urlParts.pathname.split( "/" ).pop()
    const resource = decodeURIComponent( lastPart )
    const openOptions = {
        show: true,
        title: resource,
        skipTaskbar: true,
        parent: global.mainWindow,
        autoHideMenuBar: true
    }
    return new fbwindow.open( url, openOptions )
}

async function showFile( request, ...parameters )
{
    switch( request ) {
    case 'path': 
        mainapp.sendToBrowser( 'show-file', await getContent( parameters[0], parameters[1] || undefined ) )
        break;
    case 'url':
        openWithUrl( parameters[0], parameters[1] )
        break;
    }
}

module.exports = {
    infoRequest: infoRequest,
    showFile: showFile
}
